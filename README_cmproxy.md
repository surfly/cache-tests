cmproxy specific readme
=====

### Generate new results:
 - Start the server `npm run server`
 - Start cmproxy `./cmproxy`
 - Run tests `HTTP_PROXY=http://127.0.0.1:8082 npm run --silent cli --base=http://127.0.0.1:8000 > results/cmproxy.json`
 - Results are available in the `results` directory or via the server's dashboard http://localhost:8000/

### Debugging
 - Run specific test: `HTTP_PROXY=http://127.0.0.1:8082 npm run cli --base=http://127.0.0.1:8000 --id=freshness-none`
