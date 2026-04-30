import os
import tarfile
import tempfile
from pathlib import Path
import requests

ROOT = Path(__file__).parent
APP_NAME = "sushi-counter"
CAPTAIN_URL = Path('/root/.openclaw/workspace/credentials/caprover_url.txt').read_text().strip().rstrip('/')
CAPTAIN_PASSWORD = Path('/root/.openclaw/workspace/credentials/caprover_password.txt').read_text().strip()


def login():
    resp = requests.post(f"{CAPTAIN_URL}/api/v2/login", json={"password": CAPTAIN_PASSWORD}, timeout=20)
    resp.raise_for_status()
    return resp.json()["data"]["token"]


def make_tarball():
    fd, path = tempfile.mkstemp(suffix='.tar.gz')
    os.close(fd)
    EXCLUDED = {'node_modules', '.git', '__pycache__', '.venv', '.env', '.env.local'}
    INCLUDED = ['dist','Dockerfile','nginx.conf','captain-definition','package.json','package-lock.json',
                'tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','eslint.config.js',
                'index.html','src','public','.env.example','convex']
    with tarfile.open(path, 'w:gz') as tar:
        for name in INCLUDED:
            p = ROOT / name
            if p.exists():
                tar.add(str(p), arcname=name)
    return path


def deploy():
    token = login()
    archive = make_tarball()
    try:
        headers = {'x-captain-auth': token}
        with open(archive, 'rb') as f:
            resp = requests.post(
                f"{CAPTAIN_URL}/api/v2/user/apps/appData/{APP_NAME}",
                headers=headers,
                files={'sourceFile': (APP_NAME + '.tar.gz', f, 'application/gzip')},
                timeout=600,
            )
        data = resp.json()
        print(f"Status: {resp.status_code} - {data.get('description')}")
        if resp.status_code != 200:
            print(resp.text[:2000])
            return
        # CapRover may reset replica count to 0 after build; restore it
        import subprocess
        subprocess.run(['docker','service','update','--replicas=1', f'srv-captain--{APP_NAME}'],
            capture_output=True, timeout=60)
        print("✅ Deploy complete")
    finally:
        try:
            os.remove(archive)
        except OSError:
            pass


if __name__ == '__main__':
    deploy()
