tart
  = a:(space* artist space* separator space*)? t:(space* title space*)? {
    return {
      artist: a ? a[1] : '',
      title: t ? t[1] : 'Untitled'
    }
  }

space = ' '

separator = '-' / '|'

quote = '"' / "'"

group = groupStart $(!groupEnd .)* groupEnd
  
groupStart = '(' / '['

groupEnd = ')' / ']'

artist = $(!(space* separator) .)*

title = (string / literal)

string
  = quote value:$(!quote .)* quote .* {
    return value
  }
  
literal 
  = value:$(!(space* (group)) .)* space* group* {
    return value
  }
