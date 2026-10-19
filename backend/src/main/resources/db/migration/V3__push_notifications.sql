CREATE TABLE push_tokens (
    push_token_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expo_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL,
    installation_id VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_push_user_installation UNIQUE (user_id, installation_id)
);

CREATE INDEX idx_push_tokens_user_active ON push_tokens(user_id, active);

CREATE TABLE push_deliveries (
    delivery_id VARCHAR(36) PRIMARY KEY,
    event_key VARCHAR(255) NOT NULL,
    push_token_id VARCHAR(36) NOT NULL REFERENCES push_tokens(push_token_id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    ticket_id VARCHAR(255),
    error_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_push_delivery_event_token UNIQUE (event_key, push_token_id)
);

CREATE INDEX idx_push_delivery_receipt ON push_deliveries(status, updated_at);
