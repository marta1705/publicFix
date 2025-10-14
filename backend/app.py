from flask import Flask
from .db import db_init
from .models import Report
from .routes.report import report
import os
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost/publicFix'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
CORS(app)
db_init(app)

app.register_blueprint(report, url_prefix='')

@app.route('/')
def hello():
    return "Hello, World!"

if (__name__ == '__main__'):
    app.run(debug=True)

