#!/usr/bin/env node
const fetchcomment = require('./main')
const fmtnm = v => v && Number(v)*1000
fetchcomment(process.argv[2],fmtnm(process.argv[4]),fmtnm(process.argv[5]),cb).then(comments=>{
})
function cb(chats) {
  const csv = require('csv-stringify/lib/sync')(chats)
  process.stdout.write(csv)
}
