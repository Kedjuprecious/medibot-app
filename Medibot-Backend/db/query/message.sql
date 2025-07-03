-- name: CreateUser :exec
INSERT INTO users (email,username,role,experience,location,license_number)
VALUES ($1,$2,$3,$4,$5,$6);

-- name: GetUser :one
SELECT * FROM users 
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users 
WHERE email = $1;


-- name: CreateConversation :one
INSERT INTO conversation (user_id)
VALUES ($1)
RETURNING id;

-- name: GetConversation :one
SELECT id, user_id, created_at FROM conversation
WHERE id = $1 AND user_id = $2;

-- name: CreateMessage :exec
INSERT INTO messages (con_id,sender,content)
VALUES($1,$2,$3);

-- name: CreateSummaries :exec
INSERT INTO summaries (content,conversation_id,patient_id,doctor_id)
VALUES ($1,$2,$3,$4);

-- name: GetSummary :one
SELECT * FROM summaries WHERE id = $1;

-- name: GetConMessages :many
SELECT m.* FROM conversation c
JOIN messages m 
ON c.id = m.con_id
WHERE c.id = $1;

-- name: ListFullConversationsByUserID :many
SELECT
    c.id AS conversation_id,
    c.created_at AS conversation_created_at,
    m.id AS message_id,
    m.sender AS message_sender,
    m.content AS message_content,
    m.timestamp AS message_timestamp
FROM
    conversation c
LEFT JOIN
    messages m ON c.id = m.con_id
WHERE
    c.user_id = $1
ORDER BY
    c.created_at DESC, m.timestamp ASC;

-- name: DeleteConversation :exec
DELETE FROM conversation 
WHERE id = $1;