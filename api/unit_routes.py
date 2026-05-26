from flask import Blueprint, request, jsonify
from database import db
from models.unit import Unit

unit_bp = Blueprint('unit', __name__)

@unit_bp.route('/api/units', methods=['GET'])
def get_units():
    units = Unit.query.all()
    return jsonify({'units': [u.to_dict() for u in units]}), 200

@unit_bp.route('/api/unit/<int:id_ei>', methods=['GET'])
def get_unit(id_ei):
    unit = Unit.query.get(id_ei)
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    return jsonify(unit.to_dict()), 200

@unit_bp.route('/api/unit/add', methods=['POST'])
def add_unit():
    data = request.json
    
    if not data or 'short_name' not in data or 'name' not in data:
        return jsonify({'error': 'Fields short_name and name are required'}), 400
    
    if Unit.query.filter_by(short_name=data['short_name']).first():
        return jsonify({'error': 'Unit with this short_name already exists'}), 409
        
    new_unit = Unit(short_name=data['short_name'], name=data['name'])
    try:
        db.session.add(new_unit)
        db.session.commit()
        return jsonify({'status': 'created', 'id_ei': new_unit.id_ei}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/api/unit/<int:id_ei>', methods=['PUT'])
def update_unit(id_ei):
    unit = Unit.query.get(id_ei)
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    data = request.json
    
    if 'short_name' in data:
        existing = Unit.query.filter(Unit.short_name == data['short_name'], Unit.id_ei != id_ei).first()
        if existing:
            return jsonify({'error': 'Short name already exists'}), 409
        unit.short_name = data['short_name']
        
    if 'name' in data:
        unit.name = data['name']
        
    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'unit': unit.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@unit_bp.route('/api/unit/<int:id_ei>', methods=['DELETE'])
def delete_unit(id_ei):
    unit = Unit.query.get(id_ei)
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    try:
        db.session.delete(unit)
        db.session.commit()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500