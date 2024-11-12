import { Button, Card, Spin, Typography } from '@douyinfe/semi-ui';
import { RiRefreshLine } from '@remixicon/react';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { Flex } from '../shared/semi/Flex';
import { IconButton } from '../shared/semi/IconButton.jsx';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingRandomPodcastCat,
  isLoadingTotalPodcastsCountCat,
  randomPodcastCat,
  totalPodcastsCountCat,
} from '../store/podcast/podcastCats.js';
import { fetchRandomPodcast, fetchTotalPodcastsCount } from '../store/podcast/podcastNetwork.js';

export function RandomPodcast() {
  const totalCount = useCat(totalPodcastsCountCat);
  const isLoadingTotal = useCat(isLoadingTotalPodcastsCountCat);
  const isLoading = useCat(isLoadingRandomPodcastCat);
  const randomPodcast = useCat(randomPodcastCat);

  useEffect(() => {
    fetchTotalPodcastsCount().then(() => fetchRandomPodcast());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You saved {totalCount} podcast episodes.{' '}
          <IconButton
            theme="borderless"
            icon={isLoadingTotal ? <Spin /> : <RiRefreshLine />}
            onClick={fetchTotalPodcastsCount}
          />
        </Typography.Title>
      )}

      <Button
        theme="solid"
        onClick={async () => {
          await fetchRandomPodcast();
        }}
        disabled={isLoading || !totalCount}
      >
        Get a random episode
      </Button>

      {!!randomPodcast && (
        <Flex align="center">
          <Card
            cover={<img alt="example" src={randomPodcast.images[0].url} />}
            style={{ width: 300 }}
          >
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
        </Flex>
      )}
    </ItemsWrapper>
  );
}
