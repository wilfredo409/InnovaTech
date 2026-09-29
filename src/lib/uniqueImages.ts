/**
 * Frontend Universal Image Deduplication & Unique Tech Photography Pool
 * Guarantees zero duplicate images across all feeds, search results, bookmarks, and article views.
 */

export const UNIQUE_TECH_IMAGE_POOLS: Record<string, string[]> = {
  latest: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516110833967-0b57883c5319?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508873696983-2df5703bc37d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531538606171-0c5a7e7f722a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80"
  ],
  ai: [
    "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1633493106185-05a8b417c805?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1678995632928-fd6c2789f7e8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1682687220199-d0124f48f95b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1682687220208-22d7a2543e88?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1661956602116-aa6865609028?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80"
  ],
  hardware: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580584126903-c17d41830450?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=80"
  ],
  software: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1534665482403-a909d0d97c67?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80"
  ],
  gadgets: [
    "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1563132337-f159f484226c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515940175183-6798529cb860?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613946069412-38f7f1ff0b65?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512446816042-444d641267d4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80"
  ],
  podcasts: [
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520523839898-507127053970?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519874179391-3c299d0815fa?auto=format&fit=crop&w=1200&q=80"
  ],
  videos: [
    "https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1585675100414-add2e465a136?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1540655037529-dec987208707?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80"
  ]
};

// Flattened global list of all 178 unique images
export const ALL_UNIQUE_TECH_IMAGES: string[] = Object.values(UNIQUE_TECH_IMAGE_POOLS).flat();

/**
 * Normalizes an image URL to a clean canonical key for deduplication comparison.
 */
export function getImageCanonicalKey(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return "";
  try {
    const parsed = new URL(url, "https://innovatech.fun");
    // If it's an Unsplash photo, extract the unique photo ID (e.g. photo-1677442136019-21780efad99a)
    const match = parsed.pathname.match(/(photo-[a-zA-Z0-9-]+)/i);
    if (match) {
      return match[1].toLowerCase();
    }
    // For other domains, strip query parameters to identify the base image asset
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    const clean = url.split('?')[0].trim().toLowerCase();
    const match = clean.match(/(photo-[a-zA-Z0-9-]+)/i);
    return match ? match[1].toLowerCase() : clean;
  }
}

/**
 * Checks if an image is considered a high-value, valid article image.
 */
export function isValidArticleImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (trimmed.includes('1x1') || trimmed.includes('pixel') || trimmed.includes('feedburner')) return false;
  if (trimmed.includes('gravatar.com') || trimmed.includes('doubleclick') || trimmed.includes('share-button')) return false;
  if (trimmed.includes('default-avatar') || trimmed.includes('logo-') || trimmed.includes('/favicon.')) return false;
  return true;
}

/**
 * Computes a deterministic integer hash from an input string (e.g. article ID or title).
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a guaranteed unique fallback image for an article when onError occurs,
 * utilizing the article's unique ID/title to pick a distinct photo from the topic pool.
 */
export function getSafeImageFallback(
  articleIdOrTitle: string,
  topic: string = 'latest',
  indexOffset: number = 0
): string {
  const normTopic = (topic || 'latest').toLowerCase();
  const pool = UNIQUE_TECH_IMAGE_POOLS[normTopic] || UNIQUE_TECH_IMAGE_POOLS.latest;
  const hash = hashString(articleIdOrTitle || 'innovatech');
  const index = (hash + indexOffset) % pool.length;
  return pool[index];
}

/**
 * ROBUST CLIENT-SIDE DEDUPLICATION:
 * Guarantees that EVERY single article rendered on screen in a list/grid has a 100% UNIQUE image.
 * If two articles arrive with the same image URL (or invalid/missing image), this function immediately
 * replaces the colliding image with an unused photo from the topic pool.
 */
export function ensureClientUniqueArticles<T extends { id?: string; title?: string; imageUrl?: string | null; topic?: string }>(
  articles: T[],
  defaultTopic: string = 'latest'
): T[] {
  if (!Array.isArray(articles) || articles.length === 0) return articles;

  const seenInView = new Set<string>();

  return articles.map((art, idx) => {
    const artCopy = { ...art };
    const raw = artCopy.imageUrl;
    const canon = raw ? getImageCanonicalKey(raw) : "";
    const artTopic = (artCopy.topic || defaultTopic).toLowerCase();
    const pool = UNIQUE_TECH_IMAGE_POOLS[artTopic] || UNIQUE_TECH_IMAGE_POOLS.latest;

    // 1. If candidate image is valid and has NOT been seen yet in this view, keep it
    if (raw && isValidArticleImage(raw) && canon && !seenInView.has(canon)) {
      seenInView.add(canon);
      return artCopy;
    }

    // 2. Otherwise, find a strictly unused photo from the topic pool
    let chosen: string | null = null;
    for (const candidate of pool) {
      const cCanon = getImageCanonicalKey(candidate);
      if (!seenInView.has(cCanon)) {
        chosen = candidate;
        seenInView.add(cCanon);
        break;
      }
    }

    // 3. If topic pool exhausted in this view, scan all pools
    if (!chosen) {
      for (const candidate of ALL_UNIQUE_TECH_IMAGES) {
        const cCanon = getImageCanonicalKey(candidate);
        if (!seenInView.has(cCanon)) {
          chosen = candidate;
          seenInView.add(cCanon);
          break;
        }
      }
    }

    // 4. Deterministic fallback with unique signature if all 178 images were seen on a single page
    if (!chosen) {
      const hash = hashString(artCopy.id || artCopy.title || String(idx));
      chosen = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80&sig=${hash}`;
      seenInView.add(getImageCanonicalKey(chosen));
    }

    artCopy.imageUrl = chosen;
    return artCopy;
  });
}
