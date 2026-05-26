from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from database import db
from models.car_class import Car, CarClass
from models.parameter import Parameter, CarParameter

filter_bp = Blueprint('filter', __name__)

def _format_car_full(car):
    result = car.to_dict()
    
    flex_params = CarParameter.query.filter_by(id_car=car.id_car).all()
    result['parameters'] = [p.to_dict() for p in flex_params]
    return result


@filter_bp.route('/api/cars/filter', methods=['POST'])
def filter_cars():
    data = request.json
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    id_class = data.get('id_class')
    include_children = data.get('include_children', False)
    filters = data.get('filters', [])

    target_class_ids = []
    if id_class:
        clazz = CarClass.query.get(id_class)
        if not clazz:
            return jsonify({'error': 'Class not found'}), 404
        target_class_ids = [clazz.id_class]
        if include_children:
            target_class_ids += [c.id_class for c in clazz.get_all_children()]

    base_query = Car.query.filter(Car.id_class.in_(target_class_ids)) if target_class_ids else Car.query
    candidate_ids = set(car.id_car for car in base_query.all())

    if not filters:
        cars = Car.query.filter(Car.id_class.in_(target_class_ids)).options(joinedload(Car.car_class)).all()
        return jsonify({'cars': [_format_car_full(c) for c in cars], 'count': len(cars)}), 200

    for f in filters:
        if not candidate_ids:
            break

        param = Parameter.query.filter_by(code=f.get('param_code')).first()
        if not param:
            return jsonify({'error': f'Parameter "{f.get("param_code")}" not found'}), 404

        op = f.get('op', '=')
        val = f.get('value')

        col = None
        if param.value_type in ('numeric', 'integer'):
            col = CarParameter.val_r if param.value_type == 'numeric' else CarParameter.val_int
        elif param.value_type == 'string':
            col = CarParameter.val_str
        elif param.value_type == 'datetime':
            col = CarParameter.val_datetime
        elif param.value_type == 'enum':
            col = CarParameter.enum_val

        if not col:
            continue

        q = db.session.query(CarParameter.id_car).filter(
            CarParameter.id_param == param.id_param,
            CarParameter.id_car.in_(candidate_ids)
        )

        if op == '=': q = q.filter(col == val)
        elif op == '!=': q = q.filter(col != val)
        elif op == '>': q = q.filter(col > val)
        elif op == '<': q = q.filter(col < val)
        elif op == '>=': q = q.filter(col >= val)
        elif op == '<=': q = q.filter(col <= val)
        elif op == 'like': q = q.filter(col.like(f'%{val}%'))
        elif op == 'between' and isinstance(val, list) and len(val) == 2:
            q = q.filter(col.between(val[0], val[1]))

        candidate_ids &= set(row[0] for row in q.all())

    final_cars = Car.query.filter(Car.id_car.in_(candidate_ids)).options(joinedload(Car.car_class)).all()
    return jsonify({'cars': [_format_car_full(c) for c in final_cars], 'count': len(final_cars)}), 200


@filter_bp.route('/api/car/<int:id_car>/details', methods=['GET'])
def get_car_details(id_car):
    car = Car.query.options(joinedload(Car.car_class)).get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404

    parents = car.car_class.get_all_parents()[::-1]
    class_path = [p.to_dict() for p in parents] + [car.car_class.to_dict()]

    enum_attributes = []
    for attr in car.attributes:
        enum_attributes.append({
            'id_enum': attr.id_enum,
            'enum_name': attr.enum.name,
            'value_id': attr.id_value,
            'value': attr.value_obj.value,
            'numeric_value': attr.value_obj.numeric_value,
            'icon_url': attr.value_obj.icon_url,
            'unit': attr.value_obj.unit.to_dict() if attr.value_obj.unit else None
        })

    flex_params = CarParameter.query.filter_by(id_car=id_car).all()
    formatted_params = [p.to_dict() for p in flex_params]

    return jsonify({
        'id_car': car.id_car,
        'short_name': car.short_name,
        'id_class': car.id_class,
        'class_name': car.car_class.name,
        'class_path': class_path,
        'enum_attributes': enum_attributes,
        'flexible_parameters': formatted_params
    }), 200