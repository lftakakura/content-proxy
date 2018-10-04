const express = require('express')
const requestProxy = require('express-request-proxy')
const through2 = require('through2')
const replace = require('buffer-replace')
const cors = require('cors')

const app = express()

app.options('/content_proxy/*', cors()) // enable pre-flight request for content_proxy request
app.all(
  '/content_proxy/*',
  cors(),
  (req, res, next) => {
    const regex = /(https?:)\/\/?/
    Object.keys(req.params).forEach((key) => {
      const param = req.params[key]
      const match = regex.exec(param)
      req.params[key] = param.replace(regex, `${match[1]}//`)
    })
    next()
  },
  requestProxy({
    url: '*',
    transforms: [{
      name: 'redirector',
      transform () {
        return through2(function (chunk, enc, cb) { // eslint-disable-line func-names
          const baseUrl = process.env.CONTENT_PROXY_HOST || 'http://localhost:3007'
          // const c = replace(replace(chunk, 'http://', `${baseUrl}/content_proxy/http://`), 'https://', `${baseUrl}/content_proxy/https://`)
          const c = replace(chunk, 'http://', `${baseUrl}/content_proxy/http://`)
          this.push(c)
          cb()
        })
      }
    }]
  })
)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
