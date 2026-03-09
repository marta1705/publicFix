from flask import Flask
from .db import db_init
from .models import Report
from .routes.report import report
from .routes.user import user
from.routes.admin import admin
import os
from flask_cors import CORS
from .scheduler import start_scheduler
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost/publicFix'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
CORS(app)
db_init(app)

app.register_blueprint(report, url_prefix='')
app.register_blueprint(user)
app.register_blueprint(admin)


scheduler = start_scheduler()

@app.route('/')
def hello():
    return "Hello, World!"

if (__name__ == '__main__'):
    app.run(debug=True)

