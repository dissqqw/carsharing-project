from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload, selectinload
from database import db
from models.car_class import CarClass, Car

class_bp = Blueprint('class', __name__)

@class_bp.route('/api/class/add', methods=['POST'])
def add_class():
    data = request.json
    main_class = data.get('main_class')
    
    if main_class:
        temp = CarClass(id_class=-999, main_class=main_class)
        if temp.check_cycle(main_class):
            return jsonify({'error': 'Cycle detected!'}), 400
    
    new_class = CarClass(
        name=data['name'],
        short_name=data.get('short_name', ''),
        base_ei=data.get('base_ei'),
        main_class=main_class
    )
    db.session.add(new_class)
    db.session.commit()
    return jsonify({'status': 'created', 'id_class': new_class.id_class}), 201

@class_bp.route('/api/class/<int:id_class>', methods=['DELETE'])
def delete_class(id_class):
    clazz = CarClass.query.options(joinedload(CarClass.children), joinedload(CarClass.parent)).get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    new_parent_id = clazz.main_class
    cars_in_class = Car.query.filter_by(id_class=id_class).all()

    if new_parent_id is None:
        if len(cars_in_class) > 0 or len(clazz.children) > 0:
            return jsonify({
                'error': 'Cannot delete root class that contains children or cars.'
            }), 400
        
        db.session.delete(clazz)
        db.session.commit()
        return jsonify({'status': 'deleted'}), 200

    children = CarClass.query.filter_by(main_class=id_class).all()
    for child in children:
        child.main_class = new_parent_id

    for car in cars_in_class:
        car.id_class = new_parent_id
        
    db.session.flush()
    db.session.delete(clazz)
    
    try:
        db.session.commit()
        return jsonify({
            'status': 'deleted',
            'message': f'Class deleted. {len(children)} children and {len(cars_in_class)} cars moved to parent ID {new_parent_id}.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/api/class/<int:id_class>/move', methods=['PUT'])
def move_class(id_class):
    data = request.json
    new_parent_id = data.get('new_parent_id')
    
    clazz = CarClass.query.options(joinedload(CarClass.parent)).get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    if clazz.check_cycle(new_parent_id):
        return jsonify({'error': 'Cycle detected!'}), 400
    
    clazz.main_class = new_parent_id
    db.session.commit()
    return jsonify({'status': 'moved'}), 200

@class_bp.route('/api/class/<int:id_class>/children', methods=['GET'])
def get_children(id_class):
    clazz = CarClass.query.options(joinedload(CarClass.parent)).get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    all_children = clazz.get_all_children()
    return jsonify({
        'class': clazz.to_dict(),
        'children': [c.to_dict() for c in all_children]
    }), 200

@class_bp.route('/api/class/<int:id_class>/parents', methods=['GET'])
def get_parents(id_class):
    clazz = CarClass.query.options(joinedload(CarClass.parent)).get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    all_parents = clazz.get_all_parents()
    return jsonify({
        'class': clazz.to_dict(),
        'parents': [p.to_dict() for p in all_parents]
    }), 200

@class_bp.route('/api/class/terminal', methods=['GET'])
def get_terminal_classes():
    all_classes = CarClass.query.options(selectinload(CarClass.children)).all()
    terminal = [c for c in all_classes if not c.children]
    return jsonify({'terminal_classes': [c.to_dict() for c in terminal]}), 200

@class_bp.route('/api/class/tree', methods=['GET'])
def get_tree():
    roots = CarClass.query.filter_by(main_class=None).options(selectinload(CarClass.children)).all()
    
    def build_tree(node):
        return {
            'id_class': node.id_class,
            'name': node.name,
            'base_ei': node.base_ei,
            'children': [build_tree(child) for child in node.children]
        }
    
    return jsonify({'tree': [build_tree(r) for r in roots]}), 200