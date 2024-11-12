import { Avatar, Button, Typography } from '@douyinfe/semi-ui';
import React from 'react';

import { logo } from '../shared/browser/initShared';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { Flex } from '../shared/semi/Flex';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import { signIn } from '../store/auth/authNetwork.js';

export function Welcome() {
  return (
    <PageContent>
      <ItemsWrapper>
        <Flex direction="row" align="center" p="2rem 0 1rem" m="0" gap="0.5rem">
          <Avatar src={logo} /> <Typography.Title heading={2}>Soundice</Typography.Title>
        </Flex>
        <Typography.Title heading={5}>
          Pick music and podcast randomly from your Spotify account.
        </Typography.Title>
      </ItemsWrapper>

      <ItemsWrapper gap="0">
        <Typography.Paragraph>
          How many <Typography.Text strong>albums</Typography.Text> have you saved in Spotify?
        </Typography.Paragraph>
        <Typography.Paragraph>
          How many <Typography.Text strong>bands</Typography.Text> are you following?
        </Typography.Paragraph>
        <Typography.Paragraph>
          How many <Typography.Text strong>songs</Typography.Text> have you liked?
        </Typography.Paragraph>
        <Typography.Paragraph>
          How many <Typography.Text strong>podcast episodes</Typography.Text> have you marked?
        </Typography.Paragraph>
      </ItemsWrapper>

      <ItemsWrapper>
        <Typography.Title heading={5}>
          Soundice helps you pick music and podcasts randomly from your Spotify account.
        </Typography.Title>
      </ItemsWrapper>

      <ItemsWrapper>
        <img src="/intro.gif" style={{ width: '100%', maxWidth: 400 }} />
      </ItemsWrapper>

      <ItemsWrapper gap="0">
        <Typography.Title heading={5}>
          1. Everything happens in your browser, your data is never sent to any server.
        </Typography.Title>
        <Typography.Title heading={5}>2. Free.</Typography.Title>
        <Typography.Title heading={5}>
          3. Open source:{' '}
          <Link href="https://github.com/penghuili/soundice" target="_blank">
            https://github.com/penghuili/soundice
          </Link>
        </Typography.Title>
      </ItemsWrapper>

      <ItemsWrapper align="start">
        <Button
          theme="solid"
          onClick={async () => {
            await signIn();
          }}
        >
          Connect your Spotify account
        </Button>
      </ItemsWrapper>
    </PageContent>
  );
}
