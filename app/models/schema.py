# -*- coding:utf-8 -*-

import csv

from ..app import db
from sqlalchemy import func
from ..utils import (open_text, open_json)


class Text(db.Model):
    __tablename__ = "text"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plain_text = db.Column(db.Text)


class Mapping(db.Model):
    __tablename__ = "mapping"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    label = db.Column(db.Text)
    color = db.Column(db.Text)

    @staticmethod
    def get_dict():
        return {ma.label: ma.color for ma in Mapping.query.all()}


class Annotation(db.Model):
    __tablename__ = "annotation"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mention = db.Column(db.Text)
    label = db.Column(db.Text)
    offset_start = db.Column(db.Integer)
    offset_end = db.Column(db.Integer)

    @staticmethod
    def get_annotations():
        # use data model : https://www.w3.org/TR/annotation-model/
        return [{
            "@context": "http://www.w3.org/ns/anno.jsonld",
            "id": annotation.id,
            "type": "Annotation",
            "body": [{
                "type": "TextualBody",
                "value": annotation.label,
                "purpose": "highlighting"
            }],
            "target": {
                "selector": [{
                    "type": "TextQuoteSelector",
                    "exact": annotation.mention,
                }, {
                    "type": "TextPositionSelector",
                    "start": annotation.offset_start,
                    "end":  annotation.offset_end
                }]
            }
        } for annotation in Annotation.query.order_by(Annotation.offset_start).all()]

    @staticmethod
    def get_simple_statistics():
        return {label: count for label, count in db.session.query(
            Annotation.label,
            func.count(Annotation.label)
        ).group_by(Annotation.label).all()}

    @staticmethod
    def get_mentions_count():
        mentions_counter = db.session.query(
            Annotation.label,
            Annotation.mention,
            func.count(Annotation.mention)
        ).group_by(Annotation.mention).all()

        def convert(list_tup):
            # TODO : simplify and re-factorize
            Dict = dict()
            for a, b, c in list_tup:
                group = b, c
                index = a
                Dict.setdefault(index, []).append(group)
            return Dict

        return convert(mentions_counter)


def populate_database():
    text_path = "./app/data_demo/hugo_bio.txt"
    #text_path = "./app/data_demo/long_text.txt"
    mapping_path = "./app/data_demo/mapping_demo.json"
    demo_annotations_path = "./app/data_demo/demo_annotations_hugo_bio.csv"  # else set None
    #demo_annotations_path = None
    db.drop_all()
    db.create_all()

    # Populate database with a text
    text = open_text(text_path)
    new_text = Text(plain_text=text)
    db.session.add(new_text)
    db.session.commit()

    # Populate database with a mapping
    mapping = open_json(mapping_path)
    for label, color in mapping.items():
        new_map = Mapping(label=label, color=color)
        db.session.add(new_map)
    db.session.commit()

    # Populate database with annotations examples (override
    # this sequence with other text and/or mapping)
    if demo_annotations_path is not None:
        with open(demo_annotations_path) as csv_file:
            csv_annotations = csv.reader(csv_file, delimiter=",")
            annotations = [(row[0], row[1], row[2], row[3]) for row in csv_annotations]
        for entity in annotations:
            annotation = Annotation(mention=entity[0], label=entity[1], offset_start=entity[2], offset_end=entity[3])
            db.session.add(annotation)

        db.session.commit()

