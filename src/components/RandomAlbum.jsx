import { Button, Divider, Typography } from '@douyinfe/semi-ui';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { cardWidth } from '../lib/constants.js';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import {
  isLoadingRandomAlbumCat,
  latestAlbumsCat,
  randomAlbumCat,
  totalAlbumsCountCat,
} from '../store/album/albumCats.js';
import { fetchLatestAlbums, fetchRandomAlbum } from '../store/album/albumNetwork.js';
import { AlbumItem } from './AlbumItem.jsx';
import { DiceSpinner } from './DiceSpinner.jsx';

export function RandomAlbum() {
  const totalCount = useCat(totalAlbumsCountCat);
  const latestAlbums = useCat(latestAlbumsCat);
  const isLoading = useCat(isLoadingRandomAlbumCat);
  const randomAlbum = useCat(randomAlbumCat);

  useEffect(() => {
    fetchLatestAlbums().then(() => fetchRandomAlbum());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You saved {totalCount} albums.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<DiceSpinner loading={isLoading} />}
        onClick={async () => {
          fetchRandomAlbum(true);
        }}
        size="large"
        style={{ width: cardWidth }}
        disabled={isLoading || !totalCount}
      >
        Get a random album
      </Button>

      <AlbumItem album={randomAlbum} addedAt={randomAlbum?.added_at} />

      {!!latestAlbums?.length && (
        <>
          <Divider margin="2rem" />
          <Typography.Title heading={3}>Latest saved albums</Typography.Title>
          {latestAlbums.map(item => (
            <AlbumItem key={item.added_at} album={item.album} addedAt={item.added_at} topTime />
          ))}
        </>
      )}
    </ItemsWrapper>
  );
}
