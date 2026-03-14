#!/usr/bin/env python3
"""Fix docker-compose.yml: add CELERY env vars, remove stray '-' lines."""

path = "/opt/brightclause/docker-compose.yml"
with open(path) as f:
    lines = f.readlines()

out = []
for line in lines:
    # Skip stray "-" lines left by broken sed
    if line.strip() == "-":
        continue
    out.append(line)
    # After each REDIS_URL line (not commented out), add CELERY vars
    if "REDIS_URL=redis://redis:6379/0" in line and not line.strip().startswith("#"):
        indent = line[:len(line) - len(line.lstrip())]
        out.append(f"{indent}- CELERY_BROKER_URL=redis://redis:6379/0\n")
        out.append(f"{indent}- CELERY_RESULT_BACKEND=redis://redis:6379/0\n")

with open(path, "w") as f:
    f.writelines(out)

# Verify
with open(path) as f:
    content = f.read()
print("CELERY_BROKER_URL count:", content.count("CELERY_BROKER_URL"))
print("Stray dash count:", len([l for l in content.split("\n") if l.strip() == "-"]))
print("done")
