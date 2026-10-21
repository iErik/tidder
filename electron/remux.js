// Combines a Reddit video's picture and sound, which Reddit serves as
// two separate MP4 files, into one MP4 with mediabunny. The tracks are
// copied as they are, never re-encoded (see
// docs/adr/0002-remux-reddit-videos-without-ffmpeg.md).

const {
  ALL_FORMATS,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  EncodedVideoPacketSource,
  Input,
  Mp4OutputFormat,
  Output,
  StreamTarget,
  UrlSource
} = require('mediabunny')

// A file read from url with fetchFn, in ranges, as mediabunny needs
// it. The first failed request fails the remux: mediabunny's default
// is to retry forever
function urlSource(url, fetchFn) {
  return new UrlSource(url, { fetchFn, getRetryDelay: () => null })
}

// Writes mediabunny's chunks into an open fs.promises file handle,
// each at its position
function fileWritable(handle) {
  return new WritableStream({
    write: ({ data, position }) =>
      handle.write(data, 0, data.byteLength, position)
  })
}

async function copyPackets(track, destination) {
  const decoderConfig = await track.getDecoderConfig()
  let first = true

  for await (const packet of new EncodedPacketSink(track).packets()) {
    await destination.add(packet, first ? { decoderConfig } : undefined)
    first = false
  }

  destination.close()
}

// Copies the video track of videoSource and the audio track of
// audioSource (mediabunny sources) into one MP4, written to handle.
// Rejects when either has no such track or can't be read
async function remux(videoSource, audioSource, handle) {
  const videoInput = new Input({ source: videoSource, formats: ALL_FORMATS })
  const audioInput = new Input({ source: audioSource, formats: ALL_FORMATS })
  let output = null

  try {
    const video = await videoInput.getPrimaryVideoTrack()
    const audio = await audioInput.getPrimaryAudioTrack()

    if (!video || !audio)
      throw new Error('A video and an audio track are needed')

    const videoCopy = new EncodedVideoPacketSource(await video.getCodec())
    const audioCopy = new EncodedAudioPacketSource(await audio.getCodec())

    output = new Output({
      format: new Mp4OutputFormat(),
      target: new StreamTarget(fileWritable(handle))
    })
    output.addVideoTrack(videoCopy, { rotation: await video.getRotation() })
    output.addAudioTrack(audioCopy)

    await output.start()
    // Both at once, so the muxer can interleave them
    await Promise.all([
      copyPackets(video, videoCopy),
      copyPackets(audio, audioCopy)
    ])
    await output.finalize()
  } catch (err) {
    if (output && output.state !== 'finalized')
      await output.cancel().catch(() => { })

    throw err
  } finally {
    videoInput.dispose()
    audioInput.dispose()
  }
}

module.exports = {
  remux,
  urlSource
}
