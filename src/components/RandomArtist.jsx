import { Button, Card, Divider, Typography } from '@douyinfe/semi-ui';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { cardWidth } from '../lib/constants';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingAllArtistsCat,
  isLoadingRandomArtistCat,
  randomArtistCat,
  totalArtistsCountCat,
  useLatestArtists,
} from '../store/artist/artistCats.js';
import {
  fetchAllArtists,
  fetchTotalArtistsCount,
  getRandomArtist,
} from '../store/artist/artistNetwork.js';
import { CoverImage } from './CoverImage.jsx';
import { DiceSpinner } from './DiceSpinner.jsx';

export function RandomArtist() {
  const totalCount = useCat(totalArtistsCountCat);
  const isLoading = useCat(isLoadingAllArtistsCat);
  const isLoadingRandom = useCat(isLoadingRandomArtistCat);
  const randomArtist = useCat(randomArtistCat);
  const latestArtists = useLatestArtists();

  useEffect(() => {
    fetchTotalArtistsCount()
      .then(() => fetchAllArtists())
      .then(() => getRandomArtist());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You are following {totalCount} artists.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<DiceSpinner loading={isLoadingRandom} />}
        onClick={() => {
          getRandomArtist(true);
        }}
        size="large"
        style={{ width: cardWidth }}
        disabled={isLoading || !totalCount || isLoadingRandom}
      >
        Get a random artist
      </Button>

      {!!randomArtist && <ArtistItem artist={randomArtist} />}

      {!!latestArtists?.length && (
        <>
          <Divider margin="2rem" />
          <Typography.Title heading={3}>Latest followed artists</Typography.Title>
          {latestArtists.map(item => (
            <ArtistItem key={item.id} artist={item} />
          ))}
        </>
      )}
    </ItemsWrapper>
  );
}

function ArtistItem({ artist }) {
  return (
    <Card cover={<CoverImage src={artist.images[0].url} />} style={{ width: cardWidth }}>
      <Typography.Title heading={5}>{artist.name}</Typography.Title>
      <Typography.Paragraph type="secondary">
        Followers: {artist.followers.total}
      </Typography.Paragraph>

      <Typography.Paragraph style={{ marginTop: '1rem' }}>
        <Link href={artist.external_urls.spotify} target="_blank">
          Open in Spotify
        </Link>
      </Typography.Paragraph>
    </Card>
  );
}
