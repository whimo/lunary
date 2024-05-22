# Instructions for running in a Docker container

1. Clone this repo:
```
git clone git@github.com:whimo/lunary.git
cd lunary
```

2. Create .env files (and optionally edit):
```
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```
Note that to change the database credentials, you should edit them both in `docker-compose.yml` and in `packages/backend/.env`.

3. Build and run:
```
docker-compose build
docker-compose run
```

The dashboard should be available at http://localhost:8080.
The API should be at http://localhost:3333.
Make sure to export the following environment variable in your app: `LUNARY_API_URL=http://localhost:3333`.

You can register in the dashboard with any email. The API keys can be obtained from the dashboard.

4. (Highly optional) Clean up after stopping:
```
docker-compose down -v
```
