import { Button, Card, Typography } from '@douyinfe/semi-ui';
import { RiDiceLine } from '@remixicon/react';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { formatDateTime } from '../shared/js/date.js';
import { Flex } from '../shared/semi/Flex';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingRandomPodcastCat,
  randomPodcastCat,
  totalPodcastsCountCat,
} from '../store/podcast/podcastCats.js';
import { fetchRandomPodcast, fetchTotalPodcastsCount } from '../store/podcast/podcastNetwork.js';
import { CoverImage } from './CoverImage.jsx';

export function RandomPodcast() {
  const totalCount = useCat(totalPodcastsCountCat);
  const isLoading = useCat(isLoadingRandomPodcastCat);
  const randomPodcast = useCat(randomPodcastCat);

  useEffect(() => {
    fetchTotalPodcastsCount().then(() => fetchRandomPodcast());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You saved {totalCount} podcast episodes.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<RiDiceLine />}
        onClick={async () => {
          await fetchRandomPodcast(true);
        }}
        disabled={isLoading || !totalCount}
      >
        Get a random episode
      </Button>

      {!!randomPodcast && (
        <Flex align="center">
          <Card cover={<CoverImage src={randomPodcast.images[0].url} />} style={{ width: 300 }}>
            <Typography.Title heading={5}>{randomPodcast.name}</Typography.Title>
            <Typography.Paragraph>
              <Link href={randomPodcast.show.external_urls.spotify} target="_blank">
                {randomPodcast.show.name}
              </Link>
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary">
              {randomPodcast.release_date}
            </Typography.Paragraph>

            <Typography.Paragraph style={{ marginTop: '1rem' }}>
              <Link href={randomPodcast.external_urls.spotify} target="_blank">
                Open in Spotify
              </Link>
            </Typography.Paragraph>
          </Card>

          <div style={{ width: 300, marginTop: '1rem' }}>
            <Typography.Paragraph>
              Saved at {formatDateTime(randomPodcast.added_at)}
            </Typography.Paragraph>
          </div>
        </Flex>
      )}
    </ItemsWrapper>
  );
}
