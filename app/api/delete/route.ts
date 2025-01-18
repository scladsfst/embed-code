import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  const { filename } = await req.json();

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: 'mr-rony356',
      repo: 'Eric-Audio-button',
      path: `audio/${filename}`,
    });

    if (Array.isArray(fileData) || !('sha' in fileData)) {
      throw new Error('Unexpected response format');
    }

    await octokit.repos.deleteFile({
      owner: 'mr-rony356',
      repo: 'Eric-Audio-button',
      path: `audio/${filename}`,
      message: `Delete ${filename}`,
      sha: fileData.sha,
      committer: {
        name: 'mr-rony356',
        email: 'committer@example.com',
      },
      author: {
        name: 'mr-rony356',
        email: 'author@example.com',
      },
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json({ message: 'No file available' }, { status: 404 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
