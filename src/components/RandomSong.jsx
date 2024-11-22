import { Button, Card, Divider, Typography } from '@douyinfe/semi-ui';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { cardWidth } from '../lib/constants.js';
import { formatDateTime } from '../shared/js/date.js';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingRandomSongCat,
  latestSongsCat,
  randomSongCat,
  totalSongsCountCat,
} from '../store/song/songCats.js';
import { fetchLatestSongs, fetchRandomSong } from '../store/song/songNetwork.js';
import { CoverImage } from './CoverImage.jsx';
import { DiceSpinner } from './DiceSpinner.jsx';

export function RandomSong() {
  const totalCount = useCat(totalSongsCountCat);
  const isLoading = useCat(isLoadingRandomSongCat);
  const randomSong = useCat(randomSongCat);
  const latestSongs = useCat(latestSongsCat);

  useEffect(() => {
    fetchLatestSongs().then(() => fetchRandomSong());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You liked {totalCount} songs.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<DiceSpinner loading={isLoading} />}
        onClick={async () => {
          await fetchRandomSong(true);
        }}
        size="large"
        style={{ width: cardWidth }}
        disabled={isLoading || !totalCount}
      >
        Get a random song
      </Button>

      {!!randomSong && <SongItem song={randomSong} addedAt={randomSong.added_at} />}

      {!!latestSongs?.length && (
        <>
          <Divider margin="2rem" />
          <Typography.Title heading={3}>Latest liked songs</Typography.Title>
          {latestSongs.map(item => (
            <SongItem key={item.track.id} song={item.track} addedAt={item.added_at} topTime />
          ))}
        </>
      )}
    </ItemsWrapper>
  );
}

function SongItem({ song, addedAt, topTime }) {
  return (
    <div>
      {!!topTime && !!addedAt && (
        <div style={{ width: cardWidth }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}

      <Card cover={<CoverImage src={song.album.images[0].url} />} style={{ width: cardWidth }}>
        <Typography.Title heading={5}>{song.name}</Typography.Title>
        <Typography.Paragraph>
          {song.artists.map(a => (
            <Link
              key={a.id}
              href={a.external_urls.spotify}
              target="_blank"
              style={{ marginRight: '0.5rem' }}
            >
              {a.name}
            </Link>
          ))}
        </Typography.Paragraph>
        <Typography.Paragraph>
          <Link href={song.album.external_urls.spotify} target="_blank">
            {song.album.name}
          </Link>
        </Typography.Paragraph>

        <Typography.Paragraph style={{ marginTop: '1rem' }}>
          <Link href={song.external_urls.spotify} target="_blank">
            Open in Spotify
          </Link>
        </Typography.Paragraph>
      </Card>

      {!topTime && !!addedAt && (
        <div style={{ width: cardWidth, marginTop: '1rem' }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}
    </div>
  );
}
