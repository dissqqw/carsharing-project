from flask import Flask
from flask_cors import CORS
from database import db

app = Flask(__name__)
CORS(app)

app.config.from_pyfile('config.py')
db.init_app(app)

from models.car_class import CarClass, Car
from models.unit import Unit
from models.enumeration import Enumeration, EnumValue, ClassEnum, CarEnumValue
from models.parameter import Parameter, ClassParameter, CarParameter, ParameterGroup

from api.class_routes import class_bp
from api.car_routes import car_bp
from api.enum_routes import enum_bp
from api.unit_routes import unit_bp
from api.parameter_routes import parameter_bp
from api.filter_routes import filter_bp

app.register_blueprint(class_bp)
app.register_blueprint(car_bp)
app.register_blueprint(enum_bp)
app.register_blueprint(unit_bp)
app.register_blueprint(parameter_bp)
app.register_blueprint(filter_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        if not Unit.query.first():
            db.session.add(Unit(short_name='шт', name='штуки'))
            db.session.commit()

        if not CarClass.query.first():
            root = CarClass(name='Каталог Каршеринга', short_name='ROOT')
            db.session.add(root)
            db.session.commit()
            print('База данных создана и заполнена тестовыми данными!')

    print('Сервер запущен на http://127.0.0.1:5000')
    app.run(debug=False, port=5000)