from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    role = db.Column(db.String(20), default='user')  # Możliwe role: 'user', 'admin'
    reports = db.relationship('Report', backref='user', lazy=True, cascade='all, delete-orphan')

    # represents the user object as a string, useful for debugging and logging
    def __repr__(self):
        return f'User(name: {self.first_name}, email: {self.email})'

    def __init__(self, email, password_hash, first_name, role='user'):
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.role = role

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }