from flask import Blueprint, request, jsonify
from database import db
from models.car_class import CarClass, Car
from models.enumeration import Enumeration, EnumValue, ClassEnum, CarEnumValue
from sqlalchemy.orm import selectinload

enum_bp = Blueprint('enum', __name__)

@enum_bp.route('/api/enumeration/add', methods=['POST'])
def add_enumeration():
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Field "name" is required'}), 400
    
    new_enum = Enumeration(
        name=data['name'],
        description=data.get('description', ''),
        value_type=data.get('value_type', 'string')
    )
    
    try:
        db.session.add(new_enum)
        db.session.commit()
        return jsonify({'status': 'created', 'id_enum': new_enum.id_enum}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@enum_bp.route('/api/enumerations', methods=['GET'])
def get_enumerations():
    enums = Enumeration.query.options(selectinload(Enumeration.values)).all()
    return jsonify({'enumerations': [e.to_dict() for e in enums]}), 200

@enum_bp.route('/api/enumeration/<int:id_enum>', methods=['GET'])
def get_enumeration(id_enum):
    enum = Enumeration.query.get(id_enum)
    if not enum:
        return jsonify({'error': 'Enumeration not found'}), 404
    
    values = EnumValue.query.filter_by(id_enum=id_enum)\
                           .order_by(EnumValue.sort_order)\
                           .all()
    
    result = enum.to_dict()
    result['values'] = [v.to_dict() for v in values]
    return jsonify(result), 200

@enum_bp.route('/api/enumeration/<int:id_enum>', methods=['PUT'])
def update_enumeration(id_enum):
    enum = Enumeration.query.get(id_enum)
    if not enum:
        return jsonify({'error': 'Enumeration not found'}), 404
    
    data = request.json
    
    if 'name' in data:
        enum.name = data['name']
    if 'description' in data:
        enum.description = data['description']
    if 'value_type' in data:
        enum.value_type = data['value_type']
    
    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'enumeration': enum.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/enumeration/<int:id_enum>', methods=['DELETE'])
def delete_enumeration(id_enum):
    enum = Enumeration.query.get(id_enum)
    if not enum:
        return jsonify({'error': 'Enumeration not found'}), 404
    
    try:
        db.session.delete(enum)
        db.session.commit()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/enumeration/<int:id_enum>/value/add', methods=['POST'])
def add_enum_value(id_enum):
    enum = Enumeration.query.get(id_enum)
    if not enum:
        return jsonify({'error': 'Enumeration not found'}), 404
    
    data = request.json
    
    if not data or 'value' not in data:
        return jsonify({'error': 'Field "value" is required'}), 400
    
    new_value = EnumValue(
        id_enum=id_enum,
        value=data['value'],
        sort_order=data.get('sort_order', 0),
        numeric_value=data.get('numeric_value'),
        icon_url=data.get('icon_url'),
        unit_id=data.get('unit_id')
    )
    
    try:
        db.session.add(new_value)
        db.session.commit()
        return jsonify({'status': 'created', 'id_value': new_value.id_value}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/enumeration/<int:id_enum>/values', methods=['GET'])
def get_enum_values(id_enum):
    enum = Enumeration.query.get(id_enum)
    if not enum:
        return jsonify({'error': 'Enumeration not found'}), 404
    
    values = EnumValue.query.filter_by(id_enum=id_enum)\
                           .order_by(EnumValue.sort_order)\
                           .all()
    
    return jsonify({'values': [v.to_dict() for v in values]}), 200

@enum_bp.route('/api/enum-value/<int:id_value>', methods=['PUT'])
def update_enum_value(id_value):
    value = EnumValue.query.get(id_value)
    if not value:
        return jsonify({'error': 'Value not found'}), 404

    data = request.json

    if 'sort_order' in data:
        new_order = data['sort_order']
        id_enum = value.id_enum

        EnumValue.query.filter(
            EnumValue.id_enum == id_enum,
            EnumValue.sort_order >= new_order,
            EnumValue.id_value != id_value
        ).update({EnumValue.sort_order: EnumValue.sort_order + 1}, synchronize_session=False)

        value.sort_order = new_order
    else:
        if 'value' in data:
            value.value = data['value']
        if 'numeric_value' in data:
            value.numeric_value = data['numeric_value']
        if 'icon_url' in data:
            value.icon_url = data['icon_url']
        if 'unit_id' in data:
            value.unit_id = data['unit_id']

    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'value': value.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/enum-value/<int:id_value>', methods=['DELETE'])
def delete_enum_value(id_value):
    value = EnumValue.query.get(id_value)
    if not value:
        return jsonify({'error': 'Value not found'}), 404
    
    try:
        db.session.delete(value)
        db.session.commit()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/class/<int:id_class>/enum/link', methods=['POST'])
def link_enum_to_class(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    data = request.json
    enumeration = Enumeration.query.get(data.get('id_enum'))
    if not enumeration:
        return jsonify({'error': 'Enumeration not found'}), 404

    existing_link = ClassEnum.query.get((id_class, enumeration.id_enum))
    if existing_link:
        return jsonify({'error': 'Enumeration is already linked to this class'}), 409

    link = ClassEnum(
        id_class=id_class,
        id_enum=enumeration.id_enum,
        is_required=data.get('is_required', False)
    )
    db.session.add(link)
    db.session.commit()
    return jsonify({'status': 'linked', 'is_required': link.is_required}), 201

@enum_bp.route('/api/class/<int:id_class>/enums', methods=['GET'])
def get_class_enums(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    all_enums = {}
    
    def collect_enums_from_class(cls):
        for link in cls.linked_enums:
            if link.enumeration.id_enum not in all_enums:
                all_enums[link.enumeration.id_enum] = {
                    'enum': link.enumeration,
                    'is_required': link.is_required
                }
        
        if cls.main_class:
            parent = CarClass.query.get(cls.main_class)
            if parent:
                collect_enums_from_class(parent)
    
    collect_enums_from_class(clazz)
    
    result = []
    for enum_data in all_enums.values():
        enum = enum_data['enum']
        enum_dict = enum.to_dict()
        enum_dict['is_required'] = enum_data['is_required']
        
        values = EnumValue.query.filter_by(id_enum=enum.id_enum)\
                               .order_by(EnumValue.sort_order)\
                               .all()
        
        enum_dict['values'] = [v.to_dict() for v in values]
        result.append(enum_dict)
    
    return jsonify({'enums': result}), 200

@enum_bp.route('/api/car/<int:id_car>/attribute', methods=['PUT'])
def set_car_attribute(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404

    data = request.json
    id_enum = data.get('id_enum')
    id_value = data.get('id_value')

    def is_enum_allowed_for_class(cls_id, enum_id):
        link = ClassEnum.query.get((cls_id, enum_id))
        if link:
            return True
        
        clazz = CarClass.query.get(cls_id)
        if clazz and clazz.main_class:
            return is_enum_allowed_for_class(clazz.main_class, enum_id)
        
        return False

    if not is_enum_allowed_for_class(car.id_class, id_enum):
        return jsonify({'error': f'Enumeration {id_enum} is not allowed for this class'}), 400

    val = EnumValue.query.get(id_value)
    if not val or val.id_enum != id_enum:
        return jsonify({'error': f'Value {id_value} does not belong to enumeration {id_enum}'}), 400

    attribute = CarEnumValue.query.get((id_car, id_enum))
    
    if attribute:
        attribute.id_value = id_value
    else:
        attribute = CarEnumValue(id_car=id_car, id_enum=id_enum, id_value=id_value)
        db.session.add(attribute)

    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'attribute': attribute.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@enum_bp.route('/api/car/<int:id_car>/attributes', methods=['GET'])
def get_car_attributes(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404

    attributes = CarEnumValue.query.filter_by(id_car=id_car).all()
    return jsonify({'attributes': [a.to_dict() for a in attributes]}), 200