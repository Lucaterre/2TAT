from ..app import db
from sqlalchemy import func

class Annotation(db.Model):
    __tablename__ = "annotation"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mention = db.Column(db.Text)
    label = db.Column(db.Text)
    offset_start = db.Column(db.Integer)
    offset_end = db.Column(db.Integer)

    @staticmethod
    def _get_annotations():
        annotations = Annotation.query.order_by(Annotation.offset_start).all()
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
        } for annotation in annotations]


    @staticmethod
    def _get_simple_statistics():
        return {label: count for label, count in db.session.query(
            Annotation.label,
            func.count(Annotation.label)
        ).group_by(Annotation.label).all()}

    @staticmethod
    def _get_mentions_count():
        mentions_counter = db.session.query(
            Annotation.label,
            Annotation.mention,
            func.count(Annotation.mention)
        ).group_by(Annotation.mention).all()
        Dict = dict()

        def convert(list_tup):
            for a, b, c in list_tup:
                letters = b, c
                number = a
                Dict.setdefault(number, []).append(letters)
                # I only want a multiple tuple values not list of tuple
            return Dict

        return convert(mentions_counter)



def populate_database():
    db.drop_all()
    db.create_all()

    # Populate database with annotations examples
    annotations = [("Victor-Marie Hugo", "PERSON", 0, 17),
               ("Joseph Léopold Sigisbert Hugo", "PERSON", 50, 79),
               ("Doubs", "LOCATION", 202, 207),
               ("Académie française", "ORGANISATION", 411, 429),
               ("Les Feuilles d'automne", "WORK", 681, 703)]

    for entity in annotations:
        annotation = Annotation(mention=entity[0], label=entity[1], offset_start=entity[2], offset_end=entity[3])
        db.session.add(annotation)

    db.session.commit()

populate_database()


