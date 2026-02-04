from db import get_db
from models import UsersScansResults

PII_WEIGHTS_BY_TYPE = {
  "credit_card": 40,
  "social_security": 40,
  "passport": 40,

  "iban": 35,
  "bank_account": 35,
  "driving_license": 35,

  "medical_info": 30,

  "address": 25,
  "coordinates": 25,
  "financial_info": 25,

  "phone": 20,
  "sensitive_location": 20,

  "email": 15,

  "birth_date": 10,
  "personal_info": 10,

  "full_name": 8,
  "sensitive_keyword": 6,

  "ip_address": 5,
  "mac_address": 5
}

PII_WEIGHTS_BY_SOURCE = {
    "post": 1,
    "bio": 1.2,
    "highlight": 1.5,
}

def occurences_multiplier(occurrences):
    if occurrences >= 5:
        return 1.5
    elif occurrences == 4:
        return 1.4
    elif occurrences == 3:
        return 1.3
    elif occurrences == 2:
        return 1.2
    else:
        return 1.0

def calculate_score(pii_list):
    if not pii_list:
        return 100
    
    total_score = 100

    for item in pii_list:

        weight = PII_WEIGHTS_BY_TYPE.get(item.type, 0)
        occurrences_mult = occurences_multiplier(item.occurrence)
        source_mult = PII_WEIGHTS_BY_SOURCE.get(item.source, 1)

        if item.occurrence <= 0:
            continue

        deduction = weight * occurrences_mult * source_mult
        total_score -= deduction

    return max(0, round(total_score, 0))


def found_count_by_source(pii_list):
    src_counts = {
        "bio": 0,
        "post": 0,
        "highlight": 0
    }

    for item in pii_list:
        if item.source in src_counts:
            src_counts[item.source] += item.occurrence

    return src_counts

def save_scan_result(user_id, pii_list, score):

    db_session = next(get_db())

    if not pii_list:
        return

    pii_count = sum(item.occurrence for item in pii_list)
    pii_categories_count = len(set(item.type for item in pii_list))
    src_counts = found_count_by_source(pii_list)
    src_bio_count = src_counts.get("bio", 0)
    src_posts_count = src_counts.get("post", 0)
    src_highlights_count = src_counts.get("highlight", 0)


    scan_result = UsersScansResults(
        user_id=user_id,
        pii_count=pii_count,
        pii_categories_count=pii_categories_count,
        src_bio_count=src_bio_count,
        src_posts_count=src_posts_count,
        src_highlights_count=src_highlights_count,
        score=score
    )
    
    db_session.add(scan_result)
    db_session.commit()