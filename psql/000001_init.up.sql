CREATE DOMAIN non_empty_varchar_255 AS VARCHAR(255)
    CHECK (btrim(VALUE) <> '');

CREATE TABLE users(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username non_empty_varchar_255 NOT NULL,
    image_url non_empty_varchar_255 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_stats(
    user_id BIGINT PRIMARY KEY,
    buys_count BIGINT NOT NULL DEFAULT 0,
    sells_count BIGINT NOT NULL DEFAULT 0,
    favorites_count BIGINT NOT NULL DEFAULT 0,
    conversations_count BIGINT NOT NULL DEFAULT 0,
    spent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    rating_sum BIGINT NOT NULL DEFAULT 0,
    reviews_count BIGINT NOT NULL DEFAULT 0,
    max_streak_days BIGINT NOT NULL DEFAULT 0,
    max_inactive_gap_days BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    CONSTRAINT fk_user_stats_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE achievements(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code non_empty_varchar_255 NOT NULL UNIQUE,
    name non_empty_varchar_255 NOT NULL,
    description non_empty_varchar_255 NOT NULL,
    image_url non_empty_varchar_255 NOT NULL
);

CREATE TABLE achievement_rules(
    achievement_id BIGINT PRIMARY KEY,
    rule JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_achievement_rules_achievement_id
        FOREIGN KEY(achievement_id)
        REFERENCES achievements(id)
        ON DELETE CASCADE
);

CREATE TABLE yearly_recaps(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL,

    CONSTRAINT fk_yearly_recaps_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_yearly_recaps_year
        UNIQUE (user_id, year)
);

CREATE TABLE user_achievements(
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_user_achievements
        PRIMARY KEY(user_id, achievement_id),

    CONSTRAINT fk_user_achievements_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_achievements_achievement_id
        FOREIGN KEY(achievement_id)
        REFERENCES achievements(id)
        ON DELETE CASCADE
);

CREATE TABLE categories(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name non_empty_varchar_255 NOT NULL,
    parent_id BIGINT,

    CONSTRAINT fk_categories_parent_id
        FOREIGN KEY(parent_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

CREATE TABLE listings(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    image_url non_empty_varchar_255 NOT NULL,
    name non_empty_varchar_255 NOT NULL,
    city non_empty_varchar_255 NOT NULL,
    status non_empty_varchar_255 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_listings_user_id
        FOREIGN KEY (seller_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_listings_category_id
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT ,

    CONSTRAINT chk_listings_status
        CHECK (status IN ('active', 'sold', 'cancelled')),

    CONSTRAINT chk_listings_price
        CHECK (price > 0)
);

CREATE TABLE favorite_listings(
    listing_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_favorite_listings PRIMARY KEY(user_id, listing_id),

    CONSTRAINT fk_favorite_listings_listing_id
        FOREIGN KEY(listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favorite_listings_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE user_sessions(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    CONSTRAINT chk_user_sessions
        CHECK(ended_at IS NULL OR ended_at > started_at),

    CONSTRAINT fk_user_sessions_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE deals(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    status non_empty_varchar_255 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price NUMERIC(12, 2) NOT NULL,
    completed_at TIMESTAMPTZ,

    CONSTRAINT chk_deals_status
        CHECK (status IN ('pending', 'completed', 'cancelled')),

    CONSTRAINT chk_deals_price
        CHECK (price > 0),

    CONSTRAINT chk_deals_completed_at
        CHECK ((status = 'completed' AND completed_at IS NOT NULL) OR
            (status <> 'completed' AND completed_at IS NULL)),

    CONSTRAINT fk_deals_buyer_id
        FOREIGN KEY(buyer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_deals_listing_id
        FOREIGN KEY(listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE TABLE reviews(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    deal_id BIGINT NOT NULL,
    text VARCHAR(1024) NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reviews_review_once
        UNIQUE (reviewer_id, deal_id),

    CONSTRAINT chk_reviews_rating
        CHECK (rating IN (5, 4, 3, 2, 1)),

    CONSTRAINT chk_reviews_different_reviewer_and_reviewee
        CHECK (reviewer_id <> reviewee_id),

    CONSTRAINT fk_reviews_reviewer_id
        FOREIGN KEY(reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_reviewee_id
        FOREIGN KEY(reviewee_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_deal_id
        FOREIGN KEY(deal_id)
        REFERENCES deals(id)
        ON DELETE CASCADE
);

CREATE TABLE user_searches(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    query non_empty_varchar_255 NOT NULL,
    min_price NUMERIC(12, 2),
    max_price NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_user_searches_prices
        CHECK((min_price IS NULL OR min_price >= 0) AND (max_price IS NULL OR max_price >= 0) AND
            (min_price IS NULL OR max_price IS NULL OR min_price <= max_price)),

    CONSTRAINT fk_user_searches_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_searches_category_id
        FOREIGN KEY(category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

CREATE TABLE listing_views(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_listing_views_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_listing_views_listing_id
        FOREIGN KEY(listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE TABLE conversations(
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    initiator_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_conversations
        UNIQUE(initiator_id, listing_id),

    CONSTRAINT fk_conversations_initiator_id
        FOREIGN KEY(initiator_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversations_listing_id
        FOREIGN KEY(listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE TABLE conversation_participants(
    user_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,

    CONSTRAINT pk_conversation_participants
        PRIMARY KEY(user_id, conversation_id),

    CONSTRAINT fk_conversation_participants_user_id
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_participants_conversation_id
        FOREIGN KEY(conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_listings_seller_created_at
    ON listings(seller_id, created_at);

CREATE INDEX idx_listing_views_user_created_at
    ON listing_views(user_id, created_at);

CREATE INDEX idx_user_searches_user_created_at
    ON user_searches(user_id, created_at);

CREATE INDEX idx_user_sessions_user_started_at
    ON user_sessions(user_id, started_at);

CREATE INDEX idx_deals_buyer_created_at
    ON deals(buyer_id, created_at);

CREATE INDEX idx_conversation_participants_conversation_id
    ON conversation_participants(conversation_id);

CREATE UNIQUE INDEX idx_uq_deals_completed_listing
    ON deals(listing_id)
    WHERE status = 'completed';
