from .db import db

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False) 

    def __repr__(self):
        return f'<Report {self.id}>'

    def __init__(self, description, date, image_url, latitude, longitude):
        self.description = description
        self.date = date
        self.image_url = image_url
        self.latitude = latitude
        self.longitude = longitude