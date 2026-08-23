from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKeyConstraint,
    Identity,
    Index,
    MetaData,
    PrimaryKeyConstraint,
    Table,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import INET

metadata = MetaData()


t_auth_user = Table(
    "auth_user",
    metadata,
    Column(
        "id",
        BigInteger,
        Identity(
            always=True,
            start=1,
            increment=1,
            minvalue=1,
            maxvalue=9223372036854775807,
            cycle=False,
            cache=1,
        ),
        primary_key=True,
        autoincrement=True,
    ),
    Column("name", Text, nullable=False),
    Column("email", Text, nullable=False),
    Column("email_verified", Boolean, nullable=False, server_default=text("false")),
    Column("password_hash", Text),
    Column("image", Text),
    Column("is_active", Boolean, nullable=False, server_default=text("true")),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("updated_at", DateTime(True), nullable=False, server_default=text("now()")),
    PrimaryKeyConstraint("id", name="auth_user_pkey"),
    UniqueConstraint("email", name="auth_user_email_key"),
)

t_account = Table(
    "account",
    metadata,
    Column(
        "account_id",
        BigInteger,
        Identity(
            always=True,
            start=1,
            increment=1,
            minvalue=1,
            maxvalue=9223372036854775807,
            cycle=False,
            cache=1,
        ),
        primary_key=True,
        autoincrement=True,
    ),
    Column("user_id", BigInteger, nullable=False),
    Column("provider", Text, nullable=False),
    Column("provider_account_id", Text, nullable=False),
    Column("access_token", Text),
    Column("refresh_token", Text),
    Column("expires_at", DateTime(True)),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    ForeignKeyConstraint(
        ["user_id"], ["auth_user.id"], ondelete="CASCADE", name="account_user_id_fkey"
    ),
    PrimaryKeyConstraint("account_id", name="account_pkey"),
    UniqueConstraint(
        "provider", "provider_account_id", name="account_provider_provider_account_id_key"
    ),
    UniqueConstraint("user_id", "provider", name="account_user_id_provider_key"),
    Index("account_user_id_idx", "user_id"),
)

t_session = Table(
    "session",
    metadata,
    Column(
        "session_id",
        BigInteger,
        Identity(
            always=True,
            start=1,
            increment=1,
            minvalue=1,
            maxvalue=9223372036854775807,
            cycle=False,
            cache=1,
        ),
        primary_key=True,
        autoincrement=True,
    ),
    Column("user_id", BigInteger, nullable=False),
    Column("token", Text, nullable=False),
    Column("acting_as_org_id", BigInteger),
    Column("ip", INET),
    Column("user_agent", Text),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("expires_at", DateTime(True), nullable=False),
    ForeignKeyConstraint(
        ["user_id"], ["auth_user.id"], ondelete="CASCADE", name="session_user_id_fkey"
    ),
    PrimaryKeyConstraint("session_id", name="session_pkey"),
    UniqueConstraint("token", name="session_token_key"),
    Index("session_user_id_idx", "user_id"),
)

t_verification = Table(
    "verification",
    metadata,
    Column(
        "verification_id",
        BigInteger,
        Identity(
            always=True,
            start=1,
            increment=1,
            minvalue=1,
            maxvalue=9223372036854775807,
            cycle=False,
            cache=1,
        ),
        primary_key=True,
        autoincrement=True,
    ),
    Column("user_id", BigInteger),
    Column("purpose", Text, nullable=False),
    Column("token_hash", Text, nullable=False),
    Column("created_at", DateTime(True), nullable=False, server_default=text("now()")),
    Column("expires_at", DateTime(True), nullable=False),
    Column("consumed_at", DateTime(True)),
    ForeignKeyConstraint(
        ["user_id"], ["auth_user.id"], ondelete="CASCADE", name="verification_user_id_fkey"
    ),
    PrimaryKeyConstraint("verification_id", name="verification_pkey"),
    UniqueConstraint("token_hash", name="verification_token_hash_key"),
)
