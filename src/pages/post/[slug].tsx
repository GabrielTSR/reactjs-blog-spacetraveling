import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return <h1 className={styles.loadingMessage}>Carregando...</h1>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <h1>ss</h1>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div>
            <FiCalendar />
            <time>{post.first_publication_date}</time>
            <FiUser />
            <p>{post.data.author}</p>
            <FiClock />
            <time>{readTime} min</time>
          </div>
          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true, //true, false, 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: new Date(
      response.first_publication_date
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    data: {
      title: RichText.asText(response.data['title']),
      banner: {
        url: response.data['banner'].url,
      },
      subtitle: RichText.asText(response.data['subtitle']),
      author: RichText.asText(response.data['author']),
      content: response.data.content.map(content => {
        return {
          heading: RichText.asText(content.heading),
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, //30 minutes
  };
};
