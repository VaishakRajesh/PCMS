"""Entry point - run the project with:  python main.py

This file ONLY wires things together (it has almost no logic):
  1. Make sure data/ + upload folders and the default login exist.
  2. Create the FastAPI app + signed-cookie session.
  3. Serve ./static at /static (CSS, uploaded resumes).
  4. Plug in the three route files (public / auth / dashboard).
  5. Start the Uvicorn server on http://127.0.0.1:8000
"""

import os

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

import config
import routes_auth
import routes_dashboard
import routes_public
import security
import storage

# First-run setup: folders + default admin (admin/admin123) if missing.
# Existing data is NEVER overwritten here.
storage.ensure_dirs()
security.ensure_default_user()

# The web app. Docs at /docs are automatic (handy while learning FastAPI).
app = FastAPI(title="PortfolioCMS")

# Signed cookie session: request.session["user"] means "logged in".
# Needs SECRET_KEY from config.py (set a real one in production).
app.add_middleware(SessionMiddleware, secret_key=config.SECRET_KEY)

# ./static/... files (CSS, resumes) are publicly downloadable at /static/...
app.mount("/static", StaticFiles(directory=str(config.STATIC_DIR)), name="static")

# Plug in the route files. Order does not matter here (no path overlaps).
app.include_router(routes_public.router)
app.include_router(routes_auth.router)
app.include_router(routes_dashboard.router)


if __name__ == "__main__":
    # Render (and Docker) inject PORT. Bind 0.0.0.0 when PORT is set so the
    # container is reachable; default to 127.0.0.1:8000 for local dev.
    # Running `python main.py` starts the server. Same as:
    #   uvicorn main:app --host 0.0.0.0 --port $PORT
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port)
