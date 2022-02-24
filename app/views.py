import json

from flask import render_template, request, jsonify, Response
from app.models.schema import Annotation, Text, Mapping, populate_database

from app.app import (
    app, db
)

INFO_MESSAGE = "Currently, using a 2TAT demo version, if you are having " \
               "troubles click on 'remove all annotations' or click on " \
               "'Reset demo annotations'. Otherwise, clone the git " \
               "repository and run locally."


@app.route('/')
def index():
    #Get text
    text = Text.query.filter_by(id=1).first()
    # Get mapping
    mapping = Mapping._get_dict()

    stats_mentions_count = Annotation._get_mentions_count()
    return render_template("annotator.html",
                           text=text.plain_text,
                           mapping=mapping,
                           stats_mention=stats_mentions_count,
                           message_info=INFO_MESSAGE)


@app.route('/get_statitics', methods=['GET', 'POST'])
def labels_count():
    if request.method == "GET":
        return Annotation._get_simple_statistics()


@app.route('/mapping', methods=["GET", "POST"])
def get_mapping():
    if request.method == "GET":
        #Get mapping
        mapping = Mapping._get_dict()
        print("ça passe ici")
        return jsonify(mapping)
    else:
        return jsonify(status='error')


@app.route('/annotations', methods=['GET', 'POST'])
def get_annotations():
    annotations = Annotation._get_annotations()
    if request.method == "GET":
        return jsonify(annotations)
    else:
        return jsonify(status=False)


@app.route('/reload_demo_annotations', methods=['GET', 'POST'])
def reload_demo():
    populate_database()
    annotations = Annotation._get_annotations()
    if request.method == "GET":
        return jsonify(annotations)
    else:
        return jsonify(status=False)


@app.route('/delete_annotation', methods=['GET','POST'])
def remove_annotations():
    if request.method == "POST":
        data = json.loads(request.data)
        token_id = data['id']
        if str(token_id).startswith("#"):
            # New annotation provides from Recogito with UUID
            token = Annotation.query.filter_by(mention=data['mention'],
                                               label=data['label'],
                                               offset_start=data['start'],
                                               offset_end=data['end']).first()
        else:
            # Old annotation comes with autoincrement primary key ID
            token = Annotation.query.filter_by(id=int(token_id)).first()

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
        if str(token_id).startswith("#"):
            # TODO : redundant process here
            # New annotation provides from Recogito with UUID
            token = Annotation.query.filter_by(mention=data['mention'],
                                               label=data['label'],
                                               offset_start=data['start'],
                                               offset_end=data['end']).first()
            # Then update label here ...
            token.label = data['updatedLabel']

        else:
            # Old annotation comes with autoincrement primary key ID
            token = Annotation.query.filter_by(id=int(token_id)).first()
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
            entity_id = str(data['destroyOne']['id'])
            if str(entity_id).startswith('#'):
                #print(data['destroyOne'])
                mention = data['destroyOne']['target']['selector'][0]['exact']
                label = data['destroyOne']['body'][0]['value']
                start = data['destroyOne']['target']['selector'][1]['start']
                end = data['destroyOne']['target']['selector'][1]['end']
                entity = Annotation.query.filter_by(mention=mention,
                                                   label=label,
                                                   offset_start=int(start),
                                                   offset_end=int(end)).first()
            else:
                entity = db.session.query(Annotation).filter_by(id=entity_id).first()

            db.session.delete(entity)
            db.session.commit()

    return jsonify(status=True)


@app.route('/export')
def export_annotations():
    annotations = Annotation._get_annotations()
    return Response(json.dumps(annotations, ensure_ascii=False), mimetype="application/json", headers={
        "Content-Disposition": f"attachment; filename=annotations.json"
    })
