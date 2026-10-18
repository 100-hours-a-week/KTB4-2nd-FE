'use client';

import { useState } from 'react';

import type { SearchResult } from '@/features/search';

import { AnswerCard } from './answerCard';
import { EmptySearchResult } from './emptySearchResult';
import { FolderResults } from './folderResults';
import { PhotoResults } from './photoResults';
import { ResultTab, type SearchTab } from './resultTab';

export function SearchResults({ result }: { result: SearchResult }) {
  const [selectedTab, setSelectedTab] = useState<SearchTab | null>(null);
  const isEmpty = result.folders.length === 0 && result.photos.length === 0;
  const tab: SearchTab =
    selectedTab ?? (result.photos.length === 0 && result.folders.length > 0 ? 'folder' : 'photo');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AnswerCard answer={result.answer} answerError={result.answerError} />

      {isEmpty ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <EmptySearchResult />
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="검색 결과 종류"
            className="border-border-subtle mt-6 flex shrink-0 gap-5 border-b"
          >
            <ResultTab
              id="folder"
              label="폴더"
              count={result.folders.length}
              selected={tab === 'folder'}
              onSelect={() => setSelectedTab('folder')}
            />
            <ResultTab
              id="photo"
              label="사진"
              count={result.photos.length}
              selected={tab === 'photo'}
              onSelect={() => setSelectedTab('photo')}
            />
          </div>

          <div
            key={tab}
            role="tabpanel"
            id={`search-panel-${tab}`}
            aria-labelledby={`search-tab-${tab}`}
            tabIndex={0}
            className="focus-visible:outline-brand min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            {tab === 'folder' ? (
              <FolderResults folders={result.folders} />
            ) : (
              <PhotoResults photos={result.photos} folders={result.folders} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
