# -*- coding:utf-8 -*-

import json

from flask import (render_template,
                   request,
                   jsonify,
                   Response)
from app.models.schema import (Annotation,
                               Text,
                               Mapping,
                               populate_database)

from app.app import (
    app, db
)

INFO_MESSAGE = "Currently, using a 2TAT demo version, if you are having " \
               "troubles click on 'remove all annotations' or click on " \
               "'Reset demo annotations'. Otherwise, clone the git " \
               "repository and run locally."

def get_correct_data(data, from_w3c):
    if from_w3c:
        mention = data['destroyOne']['target']['selector'][0]['exact']
        label = data['destroyOne']['body'][0]['value']
        start = data['destroyOne']['target']['selector'][1]['start']
        end = data['destroyOne']['target']['selector'][1]['end']
    else:
        mention = data['mention']
        label = data['label']
        start = data['start']
        end = data['end']
    return mention, label, start, end


def get_correct_token(data, token_id, w3c_format):
    mention, label, start, end = get_correct_data(data, from_w3c=w3c_format)
    if str(token_id).startswith("#"):
        # New annotation provides from Recogito with UUID
        token = Annotation.query.filter_by(mention=mention,
                                           label=label,
                                           offset_start=start,
                                           offset_end=end).first()
    else:
        # Old annotation comes with autoincrement primary key ID
        token = Annotation.query.filter_by(id=int(token_id)).first()
    return token


@app.route('/')
def index():
    # Get text
    text = Text.query.filter_by(id=1).first()
    # Get mapping
    mapping = Mapping.get_dict()
    # Get stats on number of annotations by mentions
    stats_mentions_count = Annotation.get_mentions_count()
    return render_template("annotator.html",
                           text=text.plain_text,
                           mapping=mapping,
                           stats_mention=stats_mentions_count,
                           message_info=INFO_MESSAGE)


@app.route('/get_statitics', methods=['GET', 'POST'])
def labels_count():
    if request.method == "GET":
        return Annotation.get_simple_statistics()


@app.route('/mapping', methods=["GET", "POST"])
def get_mapping():
    if request.method == "GET":
        mapping = Mapping.get_dict()
        return jsonify(mapping)
    else:
        return jsonify(status='error')


@app.route('/annotations', methods=['GET', 'POST'])
def get_annotations():
    annotations = Annotation.get_annotations()
    if request.method == "GET":
        return jsonify(annotations)
    else:
        return jsonify(status=False)


@app.route('/reload_demo_annotations', methods=['GET', 'POST'])
def reload_demo():
    populate_database()
    annotations = Annotation.get_annotations()
    if request.method == "GET":
        return jsonify(annotations)
    else:
        return jsonify(status=False)


@app.route('/delete_annotation', methods=['GET','POST'])
def remove_annotations():
    if request.method == "POST":
        data = json.loads(request.data)
        token_id = data['id']
        token = get_correct_token(data, token_id, w3c_format=False)
        db.session.delete(token)
        db.session.commit()

    return jsonify(status=True)


@app.route('/new_annotation', methods=['GET','POST'])
def add_annotations():
    if request.method == "POST":
        data = json.loads(request.data)
        token = Annotation(mention=data['mention'],
                           label=data['label'],
                           offset_start=data['start'],
                           offset_end=data['end'])
        db.session.add(token)
        db.session.commit()

    return jsonify(status=True)


@app.route('/update_annotation', methods=['GET', 'POST'])
def modify_annotation():
    if request.method == "POST":
        data = json.loads(request.data)
        token_id = data['id']
        token = get_correct_token(data, token_id, w3c_format=False)
        token.label = data['updatedLabel']
        db.session.commit()
    return jsonify(status=True)


@app.route('/destroy_annotations', methods=['GET', 'POST'])
def remove_all_annotations():
    if request.method == "POST":
        data = json.loads(request.data)
        if data['destroyAll']:
            try:
                db.session.query(Annotation).delete()
                db.session.commit()
            except:
                db.session.rollback()
        elif data['destroyOne']:
            token_id = str(data['destroyOne']['id'])
            token = get_correct_token(data, token_id, w3c_format=True)
            db.session.delete(token)
            db.session.commit()

    return jsonify(status=True)


@app.route('/export')
def export_annotations():
    annotations = Annotation.get_annotations()
    return Response(json.dumps(annotations, ensure_ascii=False), mimetype="application/json", headers={
        "Content-Disposition": f"attachment; filename=annotations.json"
    })
