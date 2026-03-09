from datetime import datetime
import os
from flask import Blueprint, request
from backend.db import db
from backend.models import Report
from werkzeug.utils import secure_filename
from flask import current_app as app

report = Blueprint('report', __name__)

def format_report(report):
    return {
        'id': report.id,
        'description': report.description,
        'date': report.date.strftime('%d-%m-%Y'),
        'image_url': report.image_url,
        'status': report.status,
        'latitude': report.latitude,
        'longitude': report.longitude,
        'category': report.category,
        'user_id': report.user_id,
        'source': report.source

    }

# Create a new report
@report.route('/report', methods=['POST'])
def create_report():
    data = request.form
    description = data.get('description')
    date = data.get('date')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    category = data.get('category')
    user_id = data.get('user_id')
    source = data.get('source', 'manual')

    image = request.files.get('image')
    image_url = None
    if image:
        filename = secure_filename(image.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath)
        image_url = f'/static/uploads/{filename}'

    if not all([description, date, latitude, longitude, category]):
        return "Missing required fields", 400
    
    try:
        parsed_date = datetime.strptime(date, '%Y-%m-%d')

        new_report = Report(
            description=description,
            date=parsed_date,
            image_url=image_url,
            latitude=float(latitude),
            longitude=float(longitude),
            category=category,
            user_id=int(user_id) if user_id else None,
            source=source
        )

        db.session.add(new_report)
        db.session.commit()

    except Exception as e:
        return f"Error creating report: {str(e)}", 500

    
    return "Report created", 201

# Get all reports
@report.route('/report', methods=['GET'])
def get_reports():
    try:
        reports = Report.query.order_by(Report.date.asc()).all()
        report_list = []
        for report in reports:
            report_list.append(format_report(report))
    except Exception as e:
        return f"Error fetching reports: {str(e)}", 500

    return {"reports": report_list}, 200

# Get a report by ID
@report.route('/report/<int:report_id>', methods=['GET'])
def get_report(report_id):
    try:
        report = Report.query.get(report_id)
        if not report:
            return "Report not found", 404

        report_data = format_report(report)
    except Exception as e:
        return f"Error fetching report: {str(e)}", 500

    return {"report": report_data}, 200


# Update a report by ID
@report.route('/report/<int:report_id>', methods=['PUT'])
def update_report(report_id):
    
    try:
        report = Report.query.get(report_id)
        if not report:
            return "Report not found", 404

        data = request.form
        if 'description' in data:
            report.description = data['description']
        if 'latitude' in data:
            report.latitude = data['latitude']
        if 'longitude' in data:
            report.longitude = data['longitude']

        date_str = data.get('date')
        if date_str:
            report.date = datetime.strptime(date_str, "%Y-%m-%d")

        image = request.files.get('image')
        if image:
            if report.image_url:
                old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(report.image_url))
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)

            filename = secure_filename(image.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            report.image_url = f'/static/uploads/{filename}'

        db.session.commit()
    except Exception as e:
        return f"Error updating report: {str(e)}", 500

    return "Report updated", 200

# Delete a report by ID
@report.route('/report/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    try:
        report = Report.query.get(report_id)
        if not report:
            return "Report not found", 404
        
        if report.image_url:
            old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(report.image_url))
            if os.path.exists(old_image_path):
                os.remove(old_image_path)

        db.session.delete(report)
        db.session.commit()
    except Exception as e:
        return f"Error deleting report: {str(e)}", 500

    return "Report deleted", 200