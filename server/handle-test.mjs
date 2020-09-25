
import { noBodyStatus } from '../lib/defines.mjs'
import { fixupResponseHeader } from '../lib/header-fixup.mjs'
import { sendResponse, getHeader, configs, stash, setStash, logRequest, logResponse } from './utils.mjs'

export default function handleTest (pathSegs, request, response) {
  // identify the desired configuration for this request
  var uuid = pathSegs[0]
  if (!uuid) {
    sendResponse(response, 404, `Config Not Found for ${uuid}`)
    return
  }
  var requests = configs.get(uuid)
  if (!requests) {
    sendResponse(response, 409, `Requests not found for ${uuid}`)
    return
  }

  var serverState = stash.get(uuid) || []
  const srvReqNum = serverState.length + 1
  const cliReqNum = parseInt(request.headers['req-num']) || srvReqNum
  var reqConfig = requests[cliReqNum - 1]
  var previousConfig = requests[cliReqNum - 2]

  const now = Date.now()

  if (!reqConfig) {
    sendResponse(response, 409, `${requests[0].id} config not found for request ${srvReqNum} (anticipating ${requests.length})`)
    return
  }
  if (reqConfig.dump) logRequest(request, srvReqNum)

  // Determine what the response status should be
  var httpStatus = reqConfig.response_status || [200, 'OK']
  if ('expected_type' in reqConfig && reqConfig.expected_type.endsWith('validated')) {
    const previousLm = getHeader(previousConfig.response_headers, 'Last-Modified')
    if (previousLm && request.headers['if-modified-since'] === previousLm) {
      httpStatus = [304, 'Not Modified']
    }
    const previousEtag = getHeader(previousConfig.response_headers, 'ETag')
    if (previousEtag && request.headers['if-none-match'] === previousEtag) {
      httpStatus = [304, 'Not Modified']
    }
    if (httpStatus[0] !== 304) {
      httpStatus = [999, '304 Not Generated']
    }
  }
  response.statusCode = httpStatus[0]
  response.statusPhrase = httpStatus[1]

  // header manipulation
  var responseHeaders = reqConfig.response_headers || []
  const savedHeaders = new Map()
  response.setHeader('Server-Base-Url', request.url)
  response.setHeader('Server-Request-Count', srvReqNum)
  response.setHeader('Server-Now', now, 0)
  response.setHeader('Capability-Seen', request.headers['surrogate-capability'] || '')
  responseHeaders.forEach(header => {
    header = fixupResponseHeader(header, response.getHeaders(), reqConfig)
    if (response.hasHeader(header[0])) {
      var currentVal = response.getHeader(header[0])
      if (typeof currentVal === 'string') {
        response.setHeader(header[0], [currentVal, header[1]])
      } else if (Array.isArray(currentVal)) {
        response.setHeader(header[0], currentVal.concat(header[1]))
      } else {
        console.log(`ERROR: Unanticipated header type of ${typeof currentVal} for ${header[0]}`)
      }
    } else {
      response.setHeader(header[0], header[1])
    }
    if (header.length < 3 || header[2] === true) {
      savedHeaders.set(header[0], response.getHeader(header[0]))
    }
  })

  if (!response.hasHeader('content-type')) {
    response.setHeader('Content-Type', 'text/plain')
  }

  // stash information about this request for the client
  serverState.push({
    request_num: parseInt(request.headers['req-num']),
    request_method: request.method,
    request_headers: request.headers,
    response_headers: Array.from(savedHeaders.entries())
  })
  setStash(uuid, serverState)

  // Response body generation
  if (noBodyStatus.has(response.statusCode)) {
    response.end()
  } else {
    var content = reqConfig.response_body || uuid
    response.end(content)
  }

  // logging
  if (reqConfig.dump) logResponse(response, srvReqNum)
}