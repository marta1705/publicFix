from .db import db
from werkzeug.security import generate_password_hash, check_password_hash

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Zarejestrowane')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'<Report {self.id}>'

    def __init__(self, description, date, image_url, latitude, longitude, category, user_id=None):
        self.description = description
        self.date = date
        self.image_url = image_url
        self.latitude = latitude
        self.longitude = longitude
        self.category = category
        self.user_id = user_id


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    reports = db.relationship('Report', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.email}>'

    def __init__(self, email, password, first_name):
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.first_name = first_name

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)