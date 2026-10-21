// Reads the file URLs out of a Reddit video's DASH manifest
// (reddit_video.dash_url). The main process has no DOMParser, and
// Reddit's manifests are small and regular, so a few regular
// expressions do instead of an XML dependency.

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': '\''
}

function unescapeXml(text) {
  return text.replace(
    /&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]
  )
}

// The attributes of an opening tag's text, by name
function attributes(tagText) {
  const attrs = {}

  for (const [, name, value] of tagText.matchAll(/([\w:-]+)="([^"]*)"/g))
    attrs[name] = unescapeXml(value)

  return attrs
}

// 'video', 'audio' or something else. Older manifests only set the
// mimeType on each Representation; newer ones also set the
// AdaptationSet's contentType
function contentType(setAttrs, repAttrs) {
  const mimeType = repAttrs.mimeType || setAttrs.mimeType

  return mimeType ? mimeType.split('/')[0] : setAttrs.contentType
}

// Every Representation with a BaseURL, as { type, bandwidth, url },
// its URL resolved against the manifest's
function representations(xml, manifestUrl) {
  const sets = xml
    .matchAll(/<AdaptationSet\b([^>]*)>([\s\S]*?)<\/AdaptationSet>/g)
  const reps =
    /<Representation\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Representation>)/g
  const found = []

  for (const [, setText, setBody] of sets) {
    const setAttrs = attributes(setText)

    for (const [, repText, repBody = ''] of setBody.matchAll(reps)) {
      const baseUrl = /<BaseURL>([^<]*)<\/BaseURL>/.exec(repBody)
      if (!baseUrl) continue

      const repAttrs = attributes(repText)

      found.push({
        type: contentType(setAttrs, repAttrs),
        bandwidth: Number(repAttrs.bandwidth) || 0,
        url: new URL(unescapeXml(baseUrl[1].trim()), manifestUrl).href
      })
    }
  }

  return found
}

function highestBandwidthUrl(reps, type) {
  const ofType = reps.filter(rep => rep.type === type)
  if (!ofType.length) return null

  return ofType
    .reduce((a, b) => (b.bandwidth > a.bandwidth ? b : a))
    .url
}

// The highest-bandwidth video file, and the highest-bandwidth audio
// file or null when the video has no sound. Reddit has named the
// audio file differently over the years, so it's only ever read from
// here. Throws when the manifest has no video
function parseDashManifest(xml, manifestUrl) {
  const reps = representations(xml, manifestUrl)
  const video = highestBandwidthUrl(reps, 'video')

  if (!video)
    throw new Error('The DASH manifest has no video')

  return { video, audio: highestBandwidthUrl(reps, 'audio') }
}

module.exports = {
  parseDashManifest
}
