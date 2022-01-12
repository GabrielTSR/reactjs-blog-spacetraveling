import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Comments from '../../components/Comments';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
interface Post {
  formatted_last_publication_date: string | null;
  last_publication_date: string | null;
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

interface neighborPost {
  uid: string;
  data: { title: string };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: neighborPost[];
    nextPost: neighborPost[];
  };
  preview: boolean;
}

export default function Post({ post, preview, navigation }: PostProps) {
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

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />

        <article className={styles.post}>
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}

          <h1>{post.data.title}</h1>

          <div className={styles.postDetailsContainer}>
            <FiCalendar />
            <time>{post.first_publication_date}</time>
            <FiUser />
            <p>{post.data.author}</p>
            <FiClock />
            <time>{readTime} min</time>
          </div>

          {isPostEdited && (
            <div className={styles.editPostDateContainer}>
              <time>{post.formatted_last_publication_date}</time>
            </div>
          )}

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

          <section className={styles.changePageContainer}>
            {navigation?.prevPost.length > 0 && (
              <div className={styles.previousPage}>
                <h6>{RichText.asText(navigation.prevPost[0].data.title)}</h6>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}
            {navigation?.nextPost.length > 0 && (
              <div className={styles.nextPage}>
                <h6>{RichText.asText(navigation.nextPost[0].data.title)}</h6>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}
          </section>
        </article>
        <Comments />
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    formatted_last_publication_date: format(
      new Date(response.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    ),
    last_publication_date: format(
      new Date(response.last_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(response.data['title']),
      banner: {
        url: response.data['banner'].url,
      },
      subtitle: RichText.asText(response.data['subtitle']),
      author: RichText.asText(response.data['author']),
      content: response.data['content'].map(content => {
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
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    redirect: 60 * 30, //30 minutes
  };
};
