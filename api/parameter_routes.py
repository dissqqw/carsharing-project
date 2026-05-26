from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from database import db
from models.car_class import CarClass, Car
from models.parameter import Parameter, ClassParameter, CarParameter, ParameterGroup
from models.enumeration import EnumValue

parameter_bp = Blueprint('parameter', __name__)

def _validate_and_convert_value(param, value, enum_value_id, param_link):
    p_type = param.value_type
    
    if p_type == 'enum':
        if enum_value_id is None:
            return 'enum_value_id is required for enum parameters'
        ev = EnumValue.query.get(enum_value_id)
        if not ev or ev.id_enum != param.enum_id:
            return 'Invalid enum_value_id'
        return None
    
    if p_type in ('numeric', 'integer'):
        if value is None:
            return f'value is required for {p_type} parameter'
        try:
            num = float(value) if p_type == 'numeric' else int(value)
        except (ValueError, TypeError):
            return f'Invalid {p_type} value'
        if param_link.min_value is not None and num < param_link.min_value:
            return f'Value below minimum {param_link.min_value}'
        if param_link.max_value is not None and num > param_link.max_value:
            return f'Value exceeds maximum {param_link.max_value}'
        return None
    
    if p_type == 'string':
        if value is None:
            return 'value is required'
        if param_link.max_value and len(str(value)) > param_link.max_value:
            return f'String too long (max {int(param_link.max_value)} chars)'
        return None
    
    if p_type == 'datetime':
        if value is None:
            return 'value is required'
        try:
            datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return 'Invalid datetime format (use ISO 8601)'
        return None
    
    return f'Unsupported type: {p_type}'


@parameter_bp.route('/api/parameter/add', methods=['POST'])
def add_parameter():
    data = request.json
    
    if not data or 'code' not in data or 'name' not in data or 'value_type' not in data:
        return jsonify({'error': 'Fields code, name, value_type are required'}), 400
    
    valid_types = ['numeric', 'integer', 'string', 'datetime', 'enum']
    if data['value_type'] not in valid_types:
        return jsonify({'error': f'value_type must be one of {valid_types}'}), 400
    
    if data['value_type'] == 'enum' and 'enum_id' not in data:
        return jsonify({'error': 'enum_id is required for enum type parameters'}), 400
    
    new_param = Parameter(
        code=data['code'],
        name=data['name'],
        description=data.get('description', ''),
        value_type=data['value_type'],
        unit_id=data.get('unit_id'),
        enum_id=data.get('enum_id')
    )
    
    try:
        db.session.add(new_param)
        db.session.commit()
        return jsonify({'status': 'created', 'id_param': new_param.id_param}), 201
    except Exception as e:
        db.session.rollback()
        if 'UNIQUE constraint' in str(e):
            return jsonify({'error': 'Parameter with this code already exists'}), 409
        return jsonify({'error': str(e)}), 500


@parameter_bp.route('/api/parameters', methods=['GET'])
def get_parameters():
    params = Parameter.query.all()
    return jsonify({'parameters': [p.to_dict() for p in params]}), 200


@parameter_bp.route('/api/parameter/<int:id_param>', methods=['GET'])
def get_parameter(id_param):
    param = Parameter.query.get(id_param)
    if not param:
        return jsonify({'error': 'Parameter not found'}), 404
    return jsonify(param.to_dict()), 200


@parameter_bp.route('/api/parameter/<int:id_param>', methods=['PUT'])
def update_parameter(id_param):
    param = Parameter.query.get(id_param)
    if not param:
        return jsonify({'error': 'Parameter not found'}), 404
    
    data = request.json
    if 'name' in data:
        param.name = data['name']
    if 'description' in data:
        param.description = data['description']
    
    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'parameter': param.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@parameter_bp.route('/api/parameter/<int:id_param>', methods=['DELETE'])
def delete_parameter(id_param):
    param = Parameter.query.get(id_param)
    if not param:
        return jsonify({'error': 'Parameter not found'}), 404
    
    if ClassParameter.query.filter_by(id_param=param.id_param).first():
        return jsonify({'error': 'Cannot delete parameter that is linked to classes'}), 400
    
    try:
        db.session.delete(param)
        db.session.commit()
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@parameter_bp.route('/api/class/<int:id_class>/parameter/link', methods=['POST'])
def link_parameter_to_class(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    data = request.json
    id_param = data.get('id_param')
    
    param = Parameter.query.get(id_param)
    if not param:
        return jsonify({'error': 'Parameter not found'}), 404

    existing = ClassParameter.query.get((id_class, id_param))
    if existing:
        return jsonify({'error': 'Parameter is already linked to this class'}), 409

    min_val = data.get('min_value')
    max_val = data.get('max_value')
    
    if param.value_type in ('numeric', 'integer'):
        if min_val is not None and max_val is not None and min_val > max_val:
            return jsonify({'error': 'min_value cannot be greater than max_value'}), 400
    else:
        min_val = max_val = None

    link = ClassParameter(
        id_class=id_class,
        id_param=id_param,
        is_required=data.get('is_required', False),
        sort_order=data.get('sort_order', 0),
        min_value=min_val,
        max_value=max_val,
        id_group=data.get('id_group')
    )
    
    try:
        db.session.add(link)
        db.session.commit()
        return jsonify({'status': 'linked', 'link': link.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@parameter_bp.route('/api/class/<int:id_class>/parameters', methods=['GET'])
def get_class_parameters(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    all_params = {}
    
    def collect_params_from_class(cls):
        for link in cls.linked_params:
            if link.id_param not in all_params:
                all_params[link.id_param] = {
                    'link': link,
                    'defined_at_class': cls.id_class,
                    'defined_at_class_name': cls.name
                }
        
        if cls.main_class:
            parent = CarClass.query.get(cls.main_class)
            if parent:
                collect_params_from_class(parent)
    
    collect_params_from_class(clazz)
    
    result = []
    for item in sorted(all_params.values(), key=lambda x: x['link'].sort_order):
        link = item['link']
        param_dict = link.parameter.to_dict()
        param_dict['is_required'] = link.is_required
        param_dict['sort_order'] = link.sort_order
        param_dict['min_value'] = link.min_value
        param_dict['max_value'] = link.max_value
        param_dict['inherited_from'] = {
            'id_class': item['defined_at_class'],
            'class_name': item['defined_at_class_name']
        } if item['defined_at_class'] != id_class else None
        result.append(param_dict)
    
    return jsonify({'parameters': result}), 200


@parameter_bp.route('/api/class/<int:id_class>/group', methods=['POST'])
def create_parameter_group(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    data = request.json
    if not data or 'name' not in data:
        return jsonify({'error': 'Field "name" is required'}), 400
    
    group = ParameterGroup(
        id_class=id_class,
        name=data['name'],
        sort_order=data.get('sort_order', 0)
    )
    try:
        db.session.add(group)
        db.session.commit()
        return jsonify({'status': 'created', 'id_group': group.id_group}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@parameter_bp.route('/api/class/<int:id_class>/parameter/<int:id_param>/group', methods=['PUT'])
def assign_param_to_group(id_class, id_param):
    link = ClassParameter.query.get((id_class, id_param))
    if not link:
        return jsonify({'error': 'Parameter is not linked to this class'}), 404
    
    data = request.json
    group_id = data.get('id_group')
    
    if group_id is not None:
        group = ParameterGroup.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        if group.id_class != id_class:
            return jsonify({'error': 'Group does not belong to this class'}), 400
            
    link.id_group = group_id
    db.session.commit()
    return jsonify({'status': 'updated'}), 200


@parameter_bp.route('/api/class/<int:id_class>/parameters/grouped', methods=['GET'])
def get_class_parameters_grouped(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404

    all_params = {}
    def collect_params(cls):
        for link in cls.linked_params:
            if link.id_param not in all_params:
                all_params[link.id_param] = {'link': link, 'defined_at': cls.id_class}
        if cls.main_class:
            parent = CarClass.query.get(cls.main_class)
            if parent: collect_params(parent)
    collect_params(clazz)

    groups = {}
    ungrouped = []
    
    for item in all_params.values():
        link = item['link']
        p_dict = link.to_dict()
        p_dict['inherited_from'] = item['defined_at'] if item['defined_at'] != id_class else None
        
        if link.id_group and link.group:
            gid = link.id_group
            if gid not in groups:
                groups[gid] = {
                    'id_group': gid,
                    'name': link.group.name,
                    'sort_order': link.group.sort_order,
                    'parameters': []
                }
            groups[gid]['parameters'].append(p_dict)
        else:
            ungrouped.append(p_dict)

    sorted_groups = sorted(groups.values(), key=lambda x: x['sort_order'])
    for g in sorted_groups:
        g['parameters'].sort(key=lambda x: x['sort_order'])
    ungrouped.sort(key=lambda x: x['sort_order'])

    return jsonify({'groups': sorted_groups, 'ungrouped': ungrouped}), 200


@parameter_bp.route('/api/car/<int:id_car>/parameter', methods=['PUT'])
def set_car_parameter(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404
    
    data = request.json
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    param = None
    if 'id_param' in data:
        param = Parameter.query.get(data['id_param'])
    elif 'param_code' in data:
        param = Parameter.query.filter_by(code=data['param_code']).first()
    
    if not param:
        return jsonify({'error': 'Parameter not found'}), 404
    
    def get_param_link(cls_id, param_id):
        link = ClassParameter.query.get((cls_id, param_id))
        if link:
            return link
        clazz = CarClass.query.get(cls_id)
        if clazz and clazz.main_class:
            return get_param_link(clazz.main_class, param_id)
        return None
    
    param_link = get_param_link(car.id_class, param.id_param)
    if not param_link:
        return jsonify({'error': f'Parameter "{param.code}" is not allowed for this class'}), 400
    
    value = data.get('value')
    enum_value_id = data.get('enum_value_id')
    
    err = _validate_and_convert_value(param, value, enum_value_id, param_link)
    if err:
        return jsonify({'error': err}), 400
    
    val_r = val_int = val_str = val_datetime = enum_val = None
    if param.value_type == 'numeric':
        val_r = float(value)
    elif param.value_type == 'integer':
        val_int = int(value)
    elif param.value_type == 'string':
        val_str = str(value)
    elif param.value_type == 'datetime':
        val_datetime = datetime.fromisoformat(value.replace('Z', '+00:00'))
    elif param.value_type == 'enum':
        enum_val = enum_value_id
    
    car_param = CarParameter.query.get((id_car, param.id_param))
    if car_param:
        car_param.val_r, car_param.val_int, car_param.val_str = val_r, val_int, val_str
        car_param.val_datetime, car_param.enum_val = val_datetime, enum_val
    else:
        car_param = CarParameter(
            id_car=id_car, id_param=param.id_param,
            val_r=val_r, val_int=val_int, val_str=val_str,
            val_datetime=val_datetime, enum_val=enum_val
        )
        db.session.add(car_param)
    
    try:
        db.session.commit()
        return jsonify({'status': 'updated', 'parameter': car_param.to_dict()}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Invalid enum_value_id or FK constraint failed'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _check_missing_required_params(id_car):
    car = Car.query.get(id_car)
    if not car:
        return ["Car not found"]

    missing = []
    
    def collect_required_ids(cls_id, visited=None):
        if visited is None: visited = set()
        if cls_id in visited: return []
        visited.add(cls_id)
        
        clazz = CarClass.query.get(cls_id)
        if not clazz: return []
        
        req_ids = [link.id_param for link in clazz.linked_params if link.is_required]
        if clazz.main_class:
            req_ids += collect_required_ids(clazz.main_class, visited)
        return list(set(req_ids))

    required_ids = collect_required_ids(car.id_class)

    for pid in required_ids:
        param = Parameter.query.get(pid)
        if not param: continue

        cp = CarParameter.query.get((id_car, pid))
        is_filled = False
        if cp:
            vt = param.value_type
            if vt == 'numeric' and cp.val_r is not None: is_filled = True
            elif vt == 'integer' and cp.val_int is not None: is_filled = True
            elif vt == 'string' and cp.val_str not in (None, ''): is_filled = True
            elif vt == 'datetime' and cp.val_datetime is not None: is_filled = True
            elif vt == 'enum' and cp.enum_val is not None: is_filled = True

        if not is_filled:
            missing.append(param.code)

    return missing


@parameter_bp.route('/api/car/<int:id_car>/validation/required', methods=['GET'])
def check_car_validation(id_car):
    missing = _check_missing_required_params(id_car)
    if missing:
        return jsonify({
            'status': 'invalid',
            'message': f'Required parameters are missing',
            'missing_required': missing
        }), 400
    return jsonify({'status': 'valid', 'message': 'All required parameters are filled'}), 200


@parameter_bp.route('/api/car/<int:id_car>/parameters/batch', methods=['PUT'])
def batch_update_parameters(id_car):
    car = Car.query.get(id_car)
    if not car:
        return jsonify({'error': 'Car not found'}), 404

    data = request.json
    items = data.get('parameters', [])
    if not isinstance(items, list):
        return jsonify({'error': '"parameters" must be a list'}), 400

    updates_to_apply = []
    validation_errors = []

    for item in items:
        try:
            param = None
            if 'param_code' in item:
                param = Parameter.query.filter_by(code=item['param_code']).first()
            elif 'id_param' in item:
                param = Parameter.query.get(item['id_param'])

            if not param:
                validation_errors.append({'item': item, 'error': 'Parameter not found'})
                continue

            temp_cls = car.id_class
            param_link = None
            while temp_cls:
                param_link = ClassParameter.query.get((temp_cls, param.id_param))
                if param_link: break
                c = CarClass.query.get(temp_cls)
                temp_cls = c.main_class if c else None

            if not param_link:
                validation_errors.append({'item': item, 'error': f'Parameter {param.code} not allowed for this class'})
                continue

            err = _validate_and_convert_value(param, item.get('value'), item.get('enum_value_id'), param_link)
            if err:
                validation_errors.append({'item': item, 'error': err})
                continue

            vr, vi, vs, vd, ev = None, None, None, None, None
            if param.value_type == 'numeric': vr = float(item['value'])
            elif param.value_type == 'integer': vi = int(item['value'])
            elif param.value_type == 'string': vs = str(item['value'])
            elif param.value_type == 'datetime': vd = datetime.fromisoformat(str(item['value']).replace('Z', '+00:00'))
            elif param.value_type == 'enum': ev = item.get('enum_value_id')

            updates_to_apply.append((param.id_param, vr, vi, vs, vd, ev))

        except Exception as e:
            validation_errors.append({'item': item, 'error': str(e)})

    if validation_errors:
        return jsonify({'status': 'validation_failed', 'errors': validation_errors}), 400

    try:
        for pid, vr, vi, vs, vd, ev in updates_to_apply:
            cp = CarParameter.query.get((id_car, pid))
            if cp:
                cp.val_r, cp.val_int, cp.val_str, cp.val_datetime, cp.enum_val = vr, vi, vs, vd, ev
            else:
                db.session.add(CarParameter(id_car=id_car, id_param=pid, val_r=vr, val_int=vi, val_str=vs, val_datetime=vd, enum_val=ev))

        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': f'Successfully updated {len(updates_to_apply)} parameters',
            'updated_count': len(updates_to_apply)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'db_error', 'error': str(e)}), 500
    

@parameter_bp.route('/api/class/<int:id_class>/groups', methods=['GET'])
def get_class_groups(id_class):
    clazz = CarClass.query.get(id_class)
    if not clazz:
        return jsonify({'error': 'Class not found'}), 404
    
    groups = ParameterGroup.query.filter_by(id_class=id_class).all()
    return jsonify({'groups': [g.to_dict() for g in groups]}), 200