import React, { useState } from 'react';

function Banner() {

  const [bannerOpen, setBannerOpen] = useState(true);

  return (
    <>
      {bannerOpen && (
        <div className="fixed bottom-0 right-0 w-full md:bottom-8 md:right-12 md:w-auto z-50">
          <div className="bg-amber-100 border border-amber-300 dark:bg-amber-900 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-sm p-4 md:rounded-lg shadow-lg flex justify-between items-center">
            <div className='text-amber-800 dark:text-amber-200 inline-flex items-center'>
              <svg className="w-5 h-5 mr-2 fill-current text-amber-600" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9C7.9 1 7 1.9 7 3V21C7 22.1 7.9 23 9 23H15C16.1 23 17 22.1 17 21V19H19V17H17V15H19V13H17V11H19V9H21ZM15 21H9V3H14V8H15V21Z" />
              </svg>
              <span className="font-medium">🐝 Arıcılık Yönetim Sistemi</span>
              <span className="italic px-2">-</span>
              <span className="text-amber-700 dark:text-amber-300">Bal üretimini takip edin ve kovanlarınızı yönetin</span>
            </div>
            <button className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 pl-2 ml-3 border-l border-amber-400 dark:border-amber-600" onClick={() => setBannerOpen(false)}>
              <span className="sr-only">Kapat</span>
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 16 16">
                <path d="M12.72 3.293a1 1 0 00-1.415 0L8.012 6.586 4.72 3.293a1 1 0 00-1.414 1.414L6.598 8l-3.293 3.293a1 1 0 101.414 1.414l3.293-3.293 3.293 3.293a1 1 0 001.414-1.414L9.426 8l3.293-3.293a1 1 0 000-1.414z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Banner;