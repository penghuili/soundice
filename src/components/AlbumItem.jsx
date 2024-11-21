import { Card, Typography } from '@douyinfe/semi-ui';
import React from 'react';
import fastMemo from 'react-fast-memo';

import { formatDateTime } from '../shared/js/date.js';
import { Link } from '../shared/semi/Link.jsx';
import { CoverImage } from './CoverImage.jsx';

export const AlbumItem = fastMemo(({ album, addedAt, topTime }) => {
  if (!album) {
    return null;
  }

  return (
    <div>
      {!!topTime && !!addedAt && (
        <div style={{ width: 300 }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}

      <Card cover={<CoverImage src={album.images[0].url} />} style={{ width: 300 }}>
        <Typography.Title heading={5}>{album.name}</Typography.Title>
        <Typography.Paragraph>
          {album.artists.map(a => (
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
          {album.tracks.total} {album.tracks.total === 1 ? 'track' : 'tracks'}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">{album.release_date}</Typography.Paragraph>

        <Typography.Paragraph style={{ marginTop: '1rem' }}>
          <Link href={album.external_urls.spotify} target="_blank">
            Open in Spotify
          </Link>
        </Typography.Paragraph>
      </Card>

      {!topTime && !!addedAt && (
        <div style={{ width: 300, marginTop: '1rem' }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}
    </div>
  );
});
