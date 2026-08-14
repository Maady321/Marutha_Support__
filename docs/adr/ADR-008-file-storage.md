# ADR-008: File Storage

## Status
Accepted

## Context
Need to store profile images and verification documents securely.

## Decision
Cloudinary for file storage with MongoDB metadata.

## Alternatives Considered
- AWS S3 (more complex setup)
- Firebase Storage (vendor lock-in)
- MongoDB GridFS (not ideal for serving files)
- Local filesystem (not scalable)

## Reason
Cloudinary provides image optimization and transformations out of the box, CDN delivery, signed URLs for access control, generous free tier. Simpler than S3 for a small team. Files are NOT stored in MongoDB — only metadata (URL, access level) is stored.

## Consequences
Vendor dependency on Cloudinary, migration to S3 possible later, free tier limits (25GB bandwidth).
