from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from database import db
from models.car_class import Car, CarClass

car_bp = Blueprint('car', __name__)

@car_bp.route('/api/car/add', methods=['POST'])
def add_car():
    data = request.json
    
    if not data or 'short_name' not in data or 'id_class' not in data:
        return jsonify({'error': 'Fields short_name and id_class are required'}), 400
    
    if not CarClass.query.get(data['id_class']):
        return jsonify({'error': 'Class not found'}), 404

    new_car = Car(
        short_name=data['short_name'],
        id_class=data['id_class']
    )
    
    try:
        db.session.add(new_car)
        db.session.commit()
        return jsonify({'status': 'created', 'id_car': new_car.id_car}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@car_bp.route('/api/car/<int:id_car>', methods=['DELETE'])
def delete_car(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404
    
    db.session.delete(car)
    db.session.commit()
    return jsonify({'status': 'deleted'}), 200

@car_bp.route('/api/car/<int:id_car>', methods=['PUT'])
def update_car(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404
    
    data = request.json
    
    if 'id_class' in data: 
        target_class = CarClass.query.get(data['id_class'])
        if not target_class:
            return jsonify({'error': 'Target class does not exist'}), 404
        car.id_class = data['id_class']
    
    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'car': car.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@car_bp.route('/api/cars', methods=['GET'])
def get_cars():
    cars = Car.query.options(joinedload(Car.car_class)).all()
    return jsonify({'cars': [c.to_dict() for c in cars]}), 200

@car_bp.route('/api/cars/<int:id_class>', methods=['GET'])
def get_cars_by_class(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    all_classes = [clazz] + clazz.get_all_children()
    class_ids = [c.id_class for c in all_classes]
    
    cars = Car.query.filter(Car.id_class.in_(class_ids)).options(joinedload(Car.car_class)).all()
    return jsonify({'cars': [c.to_dict() for c in cars]}), 200