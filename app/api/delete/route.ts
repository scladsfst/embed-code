import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  const { filename } = await req.json();

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN_NEW,
  });

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: 'scladsfst',
      repo: '1on1-audio',
      path: `audio/${filename}`,
    });

    if (Array.isArray(fileData) || !('sha' in fileData)) {
      throw new Error('Unexpected response format');
    }

    await octokit.repos.deleteFile({
      owner: 'scladsfst',
      repo: '1on1-audio',
      path: `audio/${filename}`,
      message: `Delete ${filename}`,
      sha: fileData.sha,
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { message: 'No file available' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
