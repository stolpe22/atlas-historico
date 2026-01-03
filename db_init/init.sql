--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: admin
--


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: events; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.events (
    id integer NOT NULL,
    name character varying,
    description character varying,
    year_start integer,
    year_end integer,
    continent character varying,
    period character varying,
    location public.geometry(Point,4326)
);


ALTER TABLE public.events OWNER TO admin;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO admin;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.events (id, name, description, year_start, year_end, continent, period, location) FROM stdin;
1	Batalha do Maule	1471 battle between The Mapuche and Inca Empire	1471	1471	América do Sul	Idade Moderna	0101000020E6100000823D0544B1EC51C096B50BD5E6C841C0
2	1604 Arica earthquake	earthquake in South America	1604	1604	América do Sul	Idade Moderna	0101000020E61000009A999999999951C000000000008032C0
3	1641 Caracas earthquake	Earthquake in Venezuela	1641	1641	América do Sul	Idade Moderna	0101000020E61000000000000000C050C00000000000002640
4	1586 Lima–Callao earthquake	Earthquake and tsunami in Peru	1586	1586	América do Sul	Idade Moderna	0101000020E6100000CDCCCCCCCC6C53C09A999999999928C0
5	Battle of Angol	1564 battle	1564	1564	América do Sul	Idade Moderna	0101000020E610000096E3FCEABD2C52C0E91990F709E142C0
6	1647 Santiago earthquake	Evento Histórico	1647	1647	América do Sul	Idade Moderna	0101000020E61000006666666666A651C03333333333B340C0
7	Battle of Lagunillas	1557 battle	1557	1557	América do Sul	Idade Moderna	0101000020E610000099BB96900F4652C0EA95B20C716C42C0
8	Sismo de Valdivia de 1575	megassismo no Chile	1575	1575	América do Sul	Idade Moderna	0101000020E6100000CDCCCCCCCC4C52C06666666666E643C0
9	Battle of Mataquito	1557 battle of Arauco War	1557	1557	América do Sul	Idade Moderna	0101000020E610000070CE88D2DEE851C0C66D3480B78841C0
10	Battle of Ollantaytambo	1537 battle in the Spanish conquest of the Inca Empire	1537	1537	América do Sul	Idade Moderna	0101000020E6100000A14B0D74DA1052C0618D92DB1F842AC0
11	1615 Arica earthquake	major earthquake in Peru	1615	1615	América do Sul	Idade Moderna	0101000020E610000066666666669651C000000000008032C0
12	Battle of Marihueñu	1554 battle of the Arauco War in present-day central Chile	1554	1554	América do Sul	Idade Moderna	0101000020E61000008AA75613CF4A52C05416A1B2C39042C0
13	Battle of Abancay	1537 battle that took place during the Spanish conquest of Peru	1537	1537	América do Sul	Idade Moderna	0101000020E610000046F48488883852C030A2274444442BC0
14	Battle of Las Cangrejeras	1629 battle	1629	1629	América do Sul	Idade Moderna	0101000020E610000033333333332352C0545227A0898842C0
15	Second Siege of Arauco	1563 siege	1563	1563	América do Sul	Idade Moderna	0101000020E6100000048D4344445452C00000000000A042C0
16	First Siege of Fort Arauco	1563 siege	1563	1563	América do Sul	Idade Moderna	0101000020E6100000048D4344445452C00000000000A042C0
17	Segunda Batalha de Salvador	batalha militar de 1638	1638	1638	América do Sul	Idade Moderna	0101000020E6100000897895FC624143C00F340E1111F129C0
18	Battle of Catirai	1569 battle	1569	1569	América do Sul	Idade Moderna	0101000020E61000005D6DC5FEB23B52C09D11A5BDC19742C0
19	Massacre de Cajamarca	1532 battle	1532	1532	América do Sul	Idade Moderna	0101000020E610000085EB51B81EA153C05B13590BB6A01CC0
20	Batalha dos Guararapes	Parte da Insurreição Pernambucana.	1649	1649	América do Sul	Idade Moderna	0101000020E6100000D7A02FBDFD8141C08EC87729753920C0
21	Batalha de Jaquijahuana	1548 battle	1548	1548	América do Sul	Idade Moderna	0101000020E6100000658A39083A0D52C06F46CD57C9EF2AC0
22	Battle of Las Salinas	1538 battle that took place during the Spanish conquest of Peru	1538	1538	América do Sul	Idade Moderna	0101000020E61000005A99537698FE51C01E681C2222222BC0
23	Battle of Tocarema	1538 battle during the Spanish conquest of the Muisca	1538	1538	América do Sul	Idade Moderna	0101000020E61000008236397CD29B52C02C4487C091001340
24	Battle of Reynogüelén	1536 battle	1536	1536	América do Sul	Idade Moderna	0101000020E6100000E9482EFF211D52C0B459F5B9DA5242C0
25	Batalha de M'Bororé	1641 battle	1641	1641	América do Sul	Idade Moderna	0101000020E61000007CEFB1EC30754BC0A395396587B93BC0
26	Batalha Naval de Abrolhos	1631 naval battle of the Thirty Years' War	1631	1631	América do Sul	Idade Moderna	0101000020E610000045292158555543C0A8E0F082880832C0
27	1730 Valparaíso earthquake	1730 earthquake and tsunami centered in Valparaíso Region, colonial Chile	1730	1730	América do Sul	Idade Moderna	0101000020E61000000000000000E051C000000000004040C0
28	Terremoto de Riobamba	Terremoto fatal no Equador central	1797	1797	América do Sul	Idade Contemporânea	0101000020E61000006666666666A653C09A9999999999F9BF
29	Battle of La Guaira	1743 battle	1743	1743	América do Sul	Idade Moderna	0101000020E610000043E3AA2EB7BB50C03333333333332540
30	Second Battle of Tobago	1677 battle	1677	1677	América do Sul	Idade Moderna	0101000020E61000004C37894160554EC00000000000802640
31	1751 Concepción earthquake	In May 1751 a violent quake destroyed Concepción city. Según crónicas de la época, "la tierra bramaba y a la media hora comenzó a hervir el mar", pasando tres veces sobre la ciudad "con más violencia que la carrera de un caballo".	1751	1751	América do Sul	Idade Moderna	0101000020E610000000000000004052C066666666666642C0
32	1782 Mendoza earthquake	earthquake	1782	1782	América do Sul	Idade Moderna	0101000020E610000048E17A14AE4751C000000000008040C0
33	Sismo do Peru de 1687	Evento sísmico	1687	1687	América do Sul	Idade Moderna	0101000020E61000006AF3A9AAAAFA52C0EB34E9EEEE6E2EC0
34	1746 Lima - Callao earthquake	earthquake and tsunami in Peru	1746	1746	América do Sul	Idade Moderna	0101000020E610000052B81E85EB5153C03333333333B326C0
35	Inconfidência Mineira	conspiração separatista ocorrida na capitania de Minas Gerais, Estado do Brasil	1789	1789	América do Sul	Idade Contemporânea	0101000020E61000000000000000C045C066666666666634C0
36	Batalha de Tobago	3 March 1677 battle between a Dutch fleet and a French force attempting to recapture Tobago	1677	1677	América do Sul	Idade Moderna	0101000020E61000004C37894160554EC00000000000802640
37	Expedição de Cartagena	1697 French attack during the Nine Years' War	1697	1697	América do Sul	Idade Moderna	0101000020E61000000AD7A3703DE252C018265305A3D22440
38	Wager Mutiny	Royal Navy mutiny	1741	1741	América do Sul	Idade Moderna	0101000020E6100000139B8F6B43BF52C0D252793BC2D547C0
39	Battle of Sangarará	1780 battle	1780	1780	América do Sul	Idade Moderna	0101000020E61000006666666666E651C06666666666E62BC0
40	1692 Salta earthquake	Earthquake in Argentina	1692	1692	América do Sul	Idade Moderna	0101000020E610000033333333333350C066666666666639C0
41	Capture of the San Joaquin	1711 naval battle	1711	1711	América do Sul	Idade Moderna	0101000020E61000000AD7A3703DE252C018265305A3D22440
42	Recapture of Fort Zeelandia	Evento Histórico	1667	1667	América do Sul	Idade Moderna	0101000020E6100000064B75012F934BC005A3923A014D1740
43	Wager's Action	1708 naval battle in the War of the Spanish Succession	1708	1708	América do Sul	Idade Moderna	0101000020E6100000FCA9F1D24DEA52C0643BDF4F8D572440
44	1737 Valdivia earthquake	South-Central Chilean earthquake	1737	1737	América do Sul	Idade Moderna	0101000020E6100000C4D155BABB4F52C07EC9C6832DE843C0
45	Terremoto de Ambato de 1698	Terremoto en Ecuador en 1698	1698	1698	América do Sul	Idade Moderna	0101000020E6100000CDCCCCCCCCAC53C0333333333333F3BF
46	Battle of Mata Asnillos	1671 battle	1671	1671	América do Sul	Idade Moderna	0101000020E61000009B5AB6D617DF53C017B7D100DE022240
47	Batalha de Granada (1779)	naval battle of the Anglo-French War and of the War of American Independence	1779	1779	América do Sul	Idade Moderna	0101000020E61000000000000000E04EC09A99999999192840
48	1657 Concepción earthquake	1657 earthquake in Chile	1657	1657	América do Sul	Idade Moderna	0101000020E6100000DDB419A7214252C08A1C226E4E5742C0
49	Capture of Demerara and Essequibo	1782 naval battle	1782	1782	América do Sul	Idade Moderna	0101000020E6100000DA7D5C5555154DC03333333333331B40
50	Batalha do Rio de Janeiro	1710 naval battle	1710	1710	América do Sul	Idade Moderna	0101000020E6100000742497FF909645C09BE61DA7E8E836C0
51	Action of August 1702	1702 naval battle	1702	1702	América do Sul	Idade Moderna	0101000020E610000077BE9F1A2F8D52C008AC1C5A647B2640
52	Battle of Cardal	1807 battle	1807	1807	América do Sul	Idade Contemporânea	0101000020E610000099BE95F449174CC087EA392B1A7141C0
53	Battle of Miserere	1807 battle	1807	1807	América do Sul	Idade Contemporânea	0101000020E61000006ABC749318344DC0BC749318044E41C0
54	Battle of El Quilo	1814 battle	1814	1814	América do Sul	Idade Contemporânea	0101000020E6100000F6F76B15B12952C0ABCCD6F2B15442C0
55	Battle of San Félix	1817 battle	1817	1817	América do Sul	Idade Contemporânea	0101000020E61000005A63D009A14F4FC04E9B711AA2A22040
56	Battle of Curapalihue	1817 battle	1817	1817	América do Sul	Idade Contemporânea	0101000020E6100000849ECDAACF2D52C074B515FBCB6E42C0
57	Batalla de Santa Bárbara	1815 battle	1815	1815	América do Sul	Idade Contemporânea	0101000020E6100000BB7C07192A534EC00F340E1111E130C0
58	Battle of Arroyo de la China	1814 battle	1814	1814	América do Sul	Idade Contemporânea	0101000020E610000070620632541E4DC0B7438146023E40C0
59	Battle of Cucha Cucha	1814 battle	1814	1814	América do Sul	Idade Contemporânea	0101000020E610000020992FAB871C52C04006C0B2315042C0
60	Battle of Sopachuy	1817 conflict in Bolivian and Argentine Wars of Independence	1817	1817	América do Sul	Idade Contemporânea	0101000020E61000001A31FAA44F1E50C0AB8AC4925F7C33C0
61	Battle of Angostura	1817 battle in the Venezuelan War of Independence	1817	1817	América do Sul	Idade Contemporânea	0101000020E61000001EC18D942DC64FC04A46CEC29E462040
62	Battle of Clarines	1817 battle in the Venezuelan War of Independence	1817	1817	América do Sul	Idade Contemporânea	0101000020E6100000D34F7F90A14A50C061EC2C96FCE22340
63	Battle of Aragua de Barcelona	royalist victory in the Venezuelan War of Independence	1814	1814	América do Sul	Idade Contemporânea	0101000020E6100000DD262301DF3450C00AD7A3703DEA2240
64	Batalla de El Pari	1816 Official battle for the independence of the United Provinces of the Río de La Plata	1816	1816	América do Sul	Idade Contemporânea	0101000020E6100000DE4BC3EB98984FC0B45BAA564FCC31C0
65	Battle of El Roble	1813 battle of the Chilean War of Independence	1815	1815	América do Sul	Idade Contemporânea	0101000020E61000002380BCD3741A52C0FCE23187CD6042C0
66	meeting between San Martín and Belgrano	Evento Histórico	1814	1814	América do Sul	Idade Contemporânea	0101000020E610000091F1B63FC83C50C0D7A3703D0A9739C0
67	Battle of La Victoria	1814 battle epic	1814	1814	América do Sul	Idade Contemporânea	0101000020E6100000F1D46AE259D550C0F0F0ED499F742440
68	Batalha de Boyacá	1819 battle	1819	1819	América do Sul	Idade Contemporânea	0101000020E61000005DDC4603785B52C0CDCCCCCCCCCC1540
69	Batalha de Las Tres Acequias	1814 battle of the Chilean War of Independence	1814	1814	América do Sul	Idade Contemporânea	0101000020E6100000EC2FBB270FAF51C018265305A3D240C0
70	Battle of Quilmo	1819 battle	1819	1819	América do Sul	Idade Contemporânea	0101000020E61000004073EF44FD0952C07C6431B96A5542C0
71	Batalha de Maipú	battle of the Chilean War of Independence	1818	1818	América do Sul	Idade Contemporânea	0101000020E61000004208A78967B151C05E8EAA6824C040C0
72	Battle of Cachirí	1816 battle	1816	1816	América do Sul	Idade Contemporânea	0101000020E6100000E7FDC6711C3F52C0A3536EDA40271E40
73	Battle of Pagallos	1817 battle in the Venezuelan War of Independence	1817	1817	América do Sul	Idade Contemporânea	0101000020E61000000000000000804EC08FC2F5285C0F2140
74	Battle of Tarija	1817 Official battle for the independence of the United Provinces of the Río de La Plata	1817	1817	América do Sul	Idade Contemporânea	0101000020E610000041993768FE2E50C065423BC3AE8835C0
75	Second Battle of La Puerta	1814 battle	1814	1814	América do Sul	Idade Contemporânea	0101000020E6100000DB30B4814EDF50C0D229376DA0132440
76	Second Battle of Cancha Rayada	1818 battle	1818	1818	América do Sul	Idade Contemporânea	0101000020E61000005FC3345555E951C06D7ACC17E6B341C0
77	Battle of Urica	1814 battle in the Venezuelan War of Independence	1814	1814	América do Sul	Idade Contemporânea	0101000020E61000008D976E12830050C021B07268916D2340
78	Battle of Yavi	November 1816 battle during the Argentine War of Independence	1816	1816	América do Sul	Idade Contemporânea	0101000020E6100000CBDFD640A75D50C08C9F29E8B42136C0
79	Battle of Mesamávida	1819 military battle	1819	1819	América do Sul	Idade Contemporânea	0101000020E6100000FE43FAEDEB2052C0AFF6457C86C742C0
80	Batalha de Chacabuco	1817 battle of the Spanish American wars of independence	1817	1817	América do Sul	Idade Contemporânea	0101000020E61000007529E8D5C4AB51C0CEA7D0711C7F40C0
81	Battle of Cuchilla del Tambo	1816 battle	1816	1816	América do Sul	Idade Contemporânea	0101000020E6100000CEAACFD5563453C0359886E123A20340
82	Argentine Declaration of Independence	historical proclamation of Argentinean independence	1816	1816	América do Sul	Idade Contemporânea	0101000020E61000005BA2CC69034D50C04B04475555D53AC0
83	First Battle of Cancha Rayada	1814 (also known as the Disaster of Cancha Rayada) was a Patriot defeat during the Patria Vieja Campaign	1814	1814	América do Sul	Idade Contemporânea	0101000020E61000005FC3345555E951C06D7ACC17E6B341C0
84	Battle of Sipe-Sipe	1815 battle in Upper Peru, South America	1815	1815	América do Sul	Idade Contemporânea	0101000020E610000017A8DE7D429650C0A7E549CAC47431C0
85	Batalha do Pântano de Vargas	confronto armado que ocorreu em 25 de julho de 1819	1819	1819	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC4452C03333333333F31640
86	Battle of Bellavista	Evento Histórico	1826	1826	América do Sul	Idade Contemporânea	0101000020E610000080D0B2A2917452C020B4AC6824F044C0
87	Cerco de Montevidéu	1843 event in the Uruguayan Civil War	1843	1843	América do Sul	Idade Contemporânea	0101000020E6100000D4E6535555154CC0E6361909F86E41C0
88	Battle of Punta Colares	First major naval engagement of the Cisplatine War	1826	1826	América do Sul	Idade Contemporânea	0101000020E61000000000000000004DC0081A8788884841C0
89	Batalha da Vuelta de Obligado	1845 naval battle of the Anglo-French blockade of the Rio de la Plata	1845	1845	América do Sul	Idade Contemporânea	0101000020E6100000170CCA0E53E74DC02BBA11F0CDCB40C0
90	Battle of Islay	battle of 1838 between Chile and Peru-Bolivia	1838	1838	América do Sul	Idade Contemporânea	0101000020E6100000CC5D4BC8070152C0F775E09C110531C0
91	Chuquisaca mutiny	Mutiny in Bolivia	1828	1828	América do Sul	Idade Contemporânea	0101000020E610000078ED60319B5050C042674144440C33C0
92	Battle of Casma	1839 battle	1839	1839	América do Sul	Idade Contemporânea	0101000020E6100000CB64389ECF9853C0FE99417C60E722C0
93	Batalha de Famaillá	1841 battle	1841	1841	América do Sul	Idade Contemporânea	0101000020E610000008D8BBFD415A50C063439A25BF083BC0
94	Battle of Portada de Guías	battle between the Peruvian Republic and the United Restoration Army in 1838	1838	1838	América do Sul	Idade Contemporânea	0101000020E610000066666666664253C01F85EB51B81E28C0
95	Battle of Punta Malpelo	1828 Gran Columbia-Peru War naval battle	1828	1828	América do Sul	Idade Contemporânea	0101000020E6100000736891ED7C1F54C01B2FDD2406010CC0
96	Battle of San Roque	1829 battle part of the Argentine civil wars	1829	1829	América do Sul	Idade Contemporânea	0101000020E6100000B345B1600B1E50C05E45CA3FC8603FC0
97	Battle of San Cala	1841 battle	1841	1841	América do Sul	Idade Contemporânea	0101000020E610000013C15155554550C0E59DE0EEEE2E3FC0
98	Batalha de Quebracho Herrado	1840 battle of the Argentine Civil Wars	1840	1840	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC1C4FC0CDCCCCCCCC8C3FC0
99	death of Simón Bolívar	Evento Histórico	1830	1830	América do Sul	Idade Contemporânea	0101000020E610000037C07677778B52C0D1CA9CB2C3742640
100	Sismo de Salta de 1844	earthquake	1844	1844	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC2C50C0CDCCCCCCCCCC38C0
101	Third Siege of Callao	1838 siege of Callao during the War of the Confederation	1838	1838	América do Sul	Idade Contemporânea	0101000020E6100000E82C8888884853C00F340E11111128C0
102	Battle of Márquez Bridge	1829 battle in Argentinian civil war	1829	1829	América do Sul	Idade Contemporânea	0101000020E6100000C6CF1474DA604DC06AAFD382765441C0
103	Sismo do Chile de 1835	terremoto no Chile em 1835	1835	1835	América do Sul	Idade Contemporânea	0101000020E610000000000000004052C066666666666642C0
104	Batalha de Monte Santiago	1827 naval battle of the Cisplatine War	1827	1827	América do Sul	Idade Contemporânea	0101000020E61000009A99999999F94CC0545227A0896841C0
105	Capture of the schooner Peruviana	1838 naval battle	1838	1838	América do Sul	Idade Contemporânea	0101000020E610000074CA4D1BE84853C0993AFFDEBC1A28C0
106	Battle of Pudeto	Evento Histórico	1826	1826	América do Sul	Idade Contemporânea	0101000020E6100000048D4344447052C064A9497EB1F444C0
107	Battle of San Lorenzo island	1837 naval battle	1837	1837	América do Sul	Idade Contemporânea	0101000020E610000076F90E32544E53C0CD6D3212F02D28C0
108	Batalha do Passo do Rosário	battle fought in 1827 in the vicinity of the Santa Maria river, southern Brazil	1827	1827	América do Sul	Idade Contemporânea	0101000020E61000008849D4E5F66F4BC01F85EB51B83E3EC0
109	1837 Valdivia earthquake	1837 earthquake and tsunami centered in south-central Chile	1837	1837	América do Sul	Idade Contemporânea	0101000020E6100000C4D155BABB4F52C07EC9C6832DE843C0
110	Battle of the Epulafquen Lagoons	1832 battle	1832	1832	América do Sul	Idade Contemporânea	0101000020E61000005FEE93A300B951C03ACB2C42B17B42C0
111	Battle of Rodeo del Medio	1841 battle of the Argentine Civil Wars	1841	1841	América do Sul	Idade Contemporânea	0101000020E61000001B60BBBBBB2B51C03B4DBABBBB7B40C0
112	Convenção Preliminar de Paz	tratado de 1828	1828	1828	América do Sul	Idade Contemporânea	0101000020E61000005F07CE19519A45C0B7627FD93DE936C0
113	Batalha de Ingavi	battle in the 1842 Bolivian–Peruvian War	1841	1841	América do Sul	Idade Contemporânea	0101000020E6100000091B9E5E291551C0ABEFA3EABCC130C0
114	Batalha de Monte Caseros	1852 battle of the Argentinian civil wars	1852	1852	América do Sul	Idade Contemporânea	0101000020E61000006B64364C5D4E4DC080ED81D2274D41C0
115	Revolução de 11 de setembro de 1852	coup d'etat by the ruling class of Buenos Aires against the rest of the Argentine Confederation. It resulted in the Province of Buenos Aires declaring independence as the State of Buenos Aires, which lasted for ten years	1852	1852	América do Sul	Idade Contemporânea	0101000020E6100000577423E09B2F4DC09D26DDDDDD4D41C0
116	Batalha dos Toneleros	battle between the Argentine Confederation Army and the Empire of Brazil Navy in 1851, at El Tonelero pass on the Paraná River, during the Platine War	1851	1851	América do Sul	Idade Contemporânea	0101000020E61000008BC4254365074EC0EE50A09180B740C0
117	Batalha de Lomas Valentinas	1868 battle of the Paraguayan War	1868	1868	América do Sul	Idade Contemporânea	0101000020E61000000AD7A3703DC24CC0852D1D43659739C0
118	Action of 17 November 1865	1865 minor naval engagement	1865	1865	América do Sul	Idade Contemporânea	0101000020E61000001A6A4C3C2B3E52C09F559EF4494F42C0
119	Batalha de Tuiuti	embate da Guerra do Paraguai	1866	1866	América do Sul	Idade Contemporânea	0101000020E6100000A54B41AF26464DC027A6877856343BC0
120	Batalha de Curupaiti	Maior derrota da Tríplice Aliança na Guerra do Paraguai.	1866	1866	América do Sul	Idade Contemporânea	0101000020E6100000A395396587494DC0BAD48C35F11C3BC0
121	Retirada da Laguna	1868 withdrawal	1868	1868	América do Sul	Idade Contemporânea	0101000020E61000006AF3A9AAAA424CC099DB6424E01B36C0
122	Incidente da Bahia	escaramuça naval em 1864 no contexto da Guerra Civil Estadunidense	1864	1864	América do Sul	Idade Contemporânea	0101000020E610000019AC17C7714C43C069F7715555B529C0
123	Battle of Abtao	1866 battle	1866	1866	América do Sul	Idade Contemporânea	0101000020E61000000585CF431E5352C02B8716D9CEE544C0
124	1868 Arica earthquake	1868 earthquake and tsunami centered near Arica, Peru (now Chile)	1868	1868	América do Sul	Idade Contemporânea	0101000020E610000066666666669651C042674144448432C0
125	Batalha de Jataí	1865 allied victory in the Paraguayan War	1865	1865	América do Sul	Idade Contemporânea	0101000020E610000041E4C2BBBB5B4CC0E82EECDDDD1D3DC0
126	Cerco de Uruguaiana	1865 starvation campaign in the Paraguayan War	1865	1865	América do Sul	Idade Contemporânea	0101000020E6100000EAC35C4D3C8B4CC0E17A14AE47C13DC0
127	Batalha de Estero Bellaco	1866 battle of the Paraguayan War	1866	1866	América do Sul	Idade Contemporânea	0101000020E6100000454772F90FF14CC0575BB1BFEC2E3BC0
128	Batalha de Papudo	1865 naval battle of the Chincha Islands War	1865	1865	América do Sul	Idade Contemporânea	0101000020E6100000BCABC82F96DC51C01F265197DB3F40C0
129	Batalha de Callao	1866 naval battle between Spain and Peru	1866	1866	América do Sul	Idade Contemporânea	0101000020E61000000683B2C3D44953C094612B54761828C0
130	Batalha Naval do Riachuelo	batalha de 1865 da Guerra do Paraguai	1865	1865	América do Sul	Idade Contemporânea	0101000020E610000088C53DD0696B4DC009FC9FCBED8F3BC0
131	Capture of the Paquete de Maule	Evento Histórico	1866	1866	América do Sul	Idade Contemporânea	0101000020E6100000A245B6F3FD5452C0F853E3A59B8442C0
132	Passagem de Humaitá	operação naval	1868	1868	América do Sul	Idade Contemporânea	0101000020E6100000406859D148404DC052B81E85EB113BC0
133	Combate de Huite	Evento Histórico	1866	1866	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC7C52C0CDCCCCCCCC4C45C0
134	1875 Cúcuta earthquake	Earthquake in Colombia and Venezuela	1875	1875	América do Sul	Idade Contemporânea	0101000020E610000000000000002052C09A99999999991F40
135	1871 Orán earthquake	Earthquake in Argentina	1871	1871	América do Sul	Idade Contemporânea	0101000020E610000073D712F2410B50C09A999999999939C0
136	Batalha de Cerro Corá	última batalha da Guerra do Paraguai	1870	1870	América do Sul	Idade Contemporânea	0101000020E61000002F35634D3C034CC0E09F1009F8A636C0
137	Chilean International Exhibition	1875–1876 world's fair in Santiago, Chile	1875	1875	América do Sul	Idade Contemporânea	0101000020E6100000B2463D44A3AB51C0DBA2CC0699B840C0
138	Battle of Río Grande	minor military engagement that took place on 10 September 1879, during the War of the Pacific	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000183B8B25BF0C51C0DC00DBDDDDCD36C0
139	Batalha de Topáter	1879 battle between Chile and Bolivia	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000577C489AED3951C05E37052F037736C0
140	1882 Panama earthquake	largest earthquake recorded in Panamanian history	1882	1882	América do Sul	Idade Contemporânea	0101000020E61000000000000000C053C00000000000002440
141	Battle of Pucará	1882 battle	1882	1882	América do Sul	Idade Contemporânea	0101000020E61000002F46E0EC6FC952C019F8E7285B5528C0
142	Battle of San Francisco	1879 battle	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC7C51C0B5FBB8AAAAAA33C0
143	Bombardment of Callao	1880 military operation during Salpeter War	1880	1880	América do Sul	Idade Contemporânea	0101000020E6100000E82C8888884853C09A999999991928C0
144	Blockade of Iquique	Evento Histórico	1879	1879	América do Sul	Idade Contemporânea	0101000020E61000009A999999998951C0759A7477773734C0
145	Battle of Pisagua	1879 battle	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000F6285C8FC28D51C0D34D6210589933C0
146	Batalha de La Concepción	1882 battle	1882	1882	América do Sul	Idade Contemporânea	0101000020E6100000DFC5FB71FBD352C0BF9B6ED921D627C0
147	Combate Naval de Angamos	1879 naval encounter of the War of the Pacific	1879	1879	América do Sul	Idade Contemporânea	0101000020E61000000000000000C051C000000000000037C0
167	1913 Tucumán earthquake	earthquake struck Tucumán, Argentina on June 6, 1913	1913	1913	América do Sul	Idade Contemporânea	0101000020E6100000ED3EAEAAAA4A50C04B04475555553BC0
168	1908 Cruz del Eje earthquake	earthquake struck Córdoba, Argentina on September 22,1908	1908	1908	América do Sul	Idade Contemporânea	0101000020E6100000849ECDAACF0C50C0A333A04670193EC0
169	1908 Salta earthquake	earthquake struck Salta, Argentina on February 2,1908	1908	1908	América do Sul	Idade Contemporânea	0101000020E6100000ED3EAEAAAA4A50C04B044755555539C0
148	Batalha Naval de Iquique	1879 naval battle between Chile and Peru	1879	1879	América do Sul	Idade Contemporânea	0101000020E610000062D8614CFA8951C034A0DE8C9A3334C0
149	Batalha do Alto da Aliança	1880 battle in Peru	1880	1880	América do Sul	Idade Contemporânea	0101000020E61000009B72E8A1D49251C027A888A3100032C0
150	Battle of Los Corrales	Evento Histórico	1880	1880	América do Sul	Idade Contemporânea	0101000020E61000003333333333334DC08CE80911115141C0
151	Battle of Quillagua	Evento Histórico	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000C0046EDDCD6651C0E9F2E670AD9E35C0
152	Battle of Tambillo	Evento Histórico	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000575BB1BFEC0451C092CB7F48BF1D37C0
153	1877 Iquique earthquake	earthquake	1877	1877	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCC8C51C09A999999999933C0
154	Battle of San Juan and Chorrillos	1881 battle of the War of the Pacific	1881	1881	América do Sul	Idade Contemporânea	0101000020E6100000F10DBD79353D53C057B6EE6AE25928C0
155	Battle of Pampa Germania	1879 cavalry battle of the War of the Pacific	1879	1879	América do Sul	Idade Contemporânea	0101000020E6100000E5F21FD26F7551C021EA3E00A9DD33C0
156	1888 Río de la Plata earthquake	June 1888 earthquake in Argentina and Uruguay	1888	1888	América do Sul	Idade Contemporânea	0101000020E6100000383103192AF34CC0CDCCCCCCCC4C41C0
157	Proclamação da República do Brasil	golpe de Estado militar que estabeleceu a Primeira República Brasileira em 15 de novembro de 1889	1889	1889	América do Sul	Idade Contemporânea	0101000020E610000020B4AC68249845C033431A7D1BE836C0
158	Battle of El Espinillo	1893 naval battle	1893	1893	América do Sul	Idade Contemporânea	0101000020E61000003B34489B0C4D4EC0DD97C185ED7940C0
159	1892 Recreo earthquake	Evento Histórico	1892	1892	América do Sul	Idade Contemporânea	0101000020E610000000000000004050C00000000000803DC0
160	Florida Garden rally	political meeting in Buenos Aires	1889	1889	América do Sul	Idade Contemporânea	0101000020E61000002B1895D409304DC0068195438B4C41C0
161	1894 San Juan earthquake	Earthquake in Argentina	1894	1894	América do Sul	Idade Contemporânea	0101000020E610000000000000004051C09A99999999993DC0
162	Battle of Caldera Bay	1891 battle	1891	1891	América do Sul	Idade Contemporânea	0101000020E6100000295C8FC2F5B451C08FC2F5285C0F3BC0
163	Revolução Acriana	série de conflitos de fronteira entre a Bolívia e a Primeira República do Brasil	1899	1899	América do Sul	Idade Contemporânea	0101000020E6100000627A8867457352C0DDC5871BE8741CC0
164	Guerra de Canudos	conflitos ocorridos na Bahia entre 1896 e 1897	1897	1897	América do Sul	Idade Contemporânea	0101000020E6100000A411A34FFA9443C028E025D882ED23C0
165	1900 San Narciso earthquake	earthquake struck off the coast of Miranda, Venezuela on October 29, 1900	1900	1900	América do Sul	Idade Contemporânea	0101000020E610000000000000008050C00000000000002640
166	Battle of Riosinho	Evento Histórico	1900	1900	América do Sul	Idade Contemporânea	0101000020E6100000B63643601BF750C04CAEBDAA0E1824C0
170	Batalha de Más a Tierra	1915 WWI naval battle	1915	1915	América do Sul	Idade Contemporânea	0101000020E61000005DDC460378B753C0454772F90FD140C0
171	Batalha de Coronel	naval battle of 1 November 1914 off the coast of central Chile in World War I	1914	1914	América do Sul	Idade Contemporânea	0101000020E6100000105A5634127452C016DD08F8E67D42C0
172	Campeonato Sul-Americano de Futebol de 1919	terceira edição do Campeonato Sul-Americano de Futebol	1919	1919	América do Sul	Idade Contemporânea	0101000020E6100000A7255646239945C0A8E0F08288E836C0
173	Batalha das Malvinas	1914 naval battle of World War I	1914	1914	América do Sul	Idade Contemporânea	0101000020E61000005C30283B4C154CC00F93A8CBED3F4AC0
174	Campeonato Sul-Americano de Futebol de 1916	primeira edição do Campeonato Sul-Americano de Futebol	1916	1916	América do Sul	Idade Contemporânea	0101000020E61000001F85EB51B82E4DC0CDCCCCCCCC5441C0
175	1917 Villavicencio, Colombia earthquake	earthquake in Villavicencio, Colombia 1917	1917	1917	América do Sul	Idade Contemporânea	0101000020E610000037C07677776752C085CE828888881040
176	Campeonato Sul-Americano de Futebol de 1917	segunda edição do Campeonato Sul-Americano de Futebol	1917	1917	América do Sul	Idade Contemporânea	0101000020E6100000211FF46C56154CC0BBB88D06F06E41C0
177	Massacre das Bananeiras	massacre of workers for the United Fruit Company	1928	1928	América do Sul	Idade Contemporânea	0101000020E610000000000000009052C08ECEF9298E032640
178	Queda do hidroavião Santos Dumont	Brazilian plane crash	1928	1928	América do Sul	Idade Contemporânea	0101000020E610000033333333339345C0081A878888C836C0
179	Campeonato Mundial de Xadrez de 1927	chess championship	1927	1927	América do Sul	Idade Contemporânea	0101000020E6100000D42B6519E2304DC0A2B437F8C24C41C0
180	Riachuelo tram accident	Tragedy happened in Buenos Aires in 1930	1930	1930	América do Sul	Idade Contemporânea	0101000020E6100000F4C494C469304DC05C8FC2F5285441C0
181	1928 Talca earthquake	Earthquake in Chile	1928	1928	América do Sul	Idade Contemporânea	0101000020E610000000000000000052C000000000008041C0
182	Campeonato Sul-Americano de Futebol de 1926	football competition	1926	1926	América do Sul	Idade Contemporânea	0101000020E61000009A99999999A951C00000000000B840C0
183	1928 Chachapoyas earthquake	earthquake in Peru	1928	1928	América do Sul	Idade Contemporânea	0101000020E6100000B29DEFA7C6A353C025068195430B15C0
184	1927 Mendoza earthquake	earthquake struck Mendoza Province, Argentina on April 14, 1927	1927	1927	América do Sul	Idade Contemporânea	0101000020E610000000000000006051C000000000000040C0
185	Santa Catalina mutiny	1931 mutiny in Peru	1931	1931	América do Sul	Idade Contemporânea	0101000020E61000006FF59CF4BE4153C012C117AA8B1C28C0
186	Batalha de Boquerón	1932 battle	1932	1932	América do Sul	Idade Contemporânea	0101000020E61000005FE90A236EF84DC0B2DFBA320DC636C0
187	Campeonato Sul-Americano de Futebol de 1927	1927 football championship	1927	1927	América do Sul	Idade Contemporânea	0101000020E610000066666666664253C01F85EB51B81E28C0
188	1927 Aysén Region earthquake	Chilean Earthquake	1927	1927	América do Sul	Idade Contemporânea	0101000020E610000000000000004052C0CDCCCCCCCC4C46C0
189	Battle of Kilometer 7	1932–33 battle of the Chaco War	1932	1932	América do Sul	Idade Contemporânea	0101000020E6100000F329741CC7014EC0FE49F8B5606B37C0
190	Campeonato Sul-Americano de Futebol de 1929	football tournament	1929	1929	América do Sul	Idade Contemporânea	0101000020E61000001F85EB51B82E4DC0CDCCCCCCCC5441C0
191	Tunguska brasileiro	possible meteorite fall over Curuçá River, Brazil	1930	1930	América do Sul	Idade Contemporânea	0101000020E6100000FDDACF6903E951C06F453702BEB914C0
192	Tragedy of Alpatacal	1927 military train crash in Argentina	1927	1927	América do Sul	Idade Contemporânea	0101000020E610000054A5141111D150C00DB18F8888C840C0
193	1938 World Three-cushion Championship	Evento Histórico	1938	1938	América do Sul	Idade Contemporânea	0101000020E61000008C70EE0AD8304DC011EB43CD464D41C0
194	Campeonato Sul-Americano de Futebol de 1937	football tournament	1937	1937	América do Sul	Idade Contemporânea	0101000020E6100000D42B6519E2304DC0A2B437F8C24C41C0
195	Jogos Bolivarianos de 1938	Evento Histórico	1938	1938	América do Sul	Idade Contemporânea	0101000020E6100000295C8FC2F58452C05699ADE563951240
196	Golpe de Estado na Bolívia em 1934	coup d'état in Bolivia on 27 November 1934	1934	1934	América do Sul	Idade Contemporânea	0101000020E61000005C2041F163BC4FC0DDB5847CD04335C0
197	Battle of Cañada Strongest	1934 battle of the Chaco War	1934	1934	América do Sul	Idade Contemporânea	0101000020E6100000340E37D882F54EC0340E37D8822D36C0
198	Desastre do show aéreo de Santa Ana	Evento Histórico	1938	1938	América do Sul	Idade Contemporânea	0101000020E610000066666666668252C0181A5775B9BD1240
199	Black Tuesday	protest in Suriname on 7 february 1933	1933	1933	América do Sul	Idade Contemporânea	0101000020E6100000008DD2A57F934BC0B91803EB384E1740
200	Campeonato Sul-Americano de Futebol de 1935	Torneio de futebol	1935	1935	América do Sul	Idade Contemporânea	0101000020E610000066666666664253C01F85EB51B81E28C0
201	Incêndio no Parque Estadual do Rio Doce em 1967	Incêndio florestal no Parque Estadual do Rio Doce, Brasil, entre setembro e outubro de 1967.	1967	1967	América do Sul	Idade Contemporânea	0101000020E610000033D49878564445C06666666666A633C0
202	1966 Chile earthquake	Evento Histórico	1966	1966	América do Sul	Idade Contemporânea	0101000020E61000003333333333A351C05839B4C8767E39C0
203	Voo Aerolíneas Argentinas 644	1961 plane crash of an Aerolineas Argentinas DC-6 near Pardo, Buenos Aires, Argentina	1961	1961	América do Sul	Idade Contemporânea	0101000020E610000049BC7EB9FDC14DC0F12A8CA9CB1D42C0
204	1966 Peru earthquake	Evento Histórico	1966	1966	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCCAC53C066666666666625C0
205	1962 Canada Cup	golf tournament	1962	1962	América do Sul	Idade Contemporânea	0101000020E61000004E62105839444DC091ED7C3F353E41C0
206	Voo Varig 810	aviation accident	1962	1962	América do Sul	Idade Contemporânea	0101000020E6100000317A6EA12B3C53C06CB41CE8A13E28C0
207	Campeonato Mundial de Esqui Alpino de 1966	1966 edition of the FIS Alpine World Ski Championships	1966	1966	América do Sul	Idade Contemporânea	0101000020E6100000C74B3789418851C05EBA490C026B40C0
208	Campeonato Sul-Americano de Futebol de 1967	football tournament	1967	1967	América do Sul	Idade Contemporânea	0101000020E6100000166A4DF38E134CC06DC5FEB27B7241C0
209	Pan Am Flight 217	aviation accident	1968	1968	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCCBC50C03333333333332540
210	Altamirano rail disaster	train crash accident in Altamirano, Buenos Aires	1964	1964	América do Sul	Idade Contemporânea	0101000020E6100000E753E8388E134DC054B706F8E6AD41C0
211	Lake Cabrera landslide	Evento Histórico	1965	1965	América do Sul	Idade Contemporânea	0101000020E6100000C1525DC0CB1D52C0D219187959EF44C0
212	LAN Chile Flight 107	1965 plane crash of a LAN Chile DC-6B in the Andes	1965	1965	América do Sul	Idade Contemporânea	0101000020E61000004ECC4086CA8251C0EE50A09180EF40C0
213	1965 La Ligua earthquake	m7.4 earthquake and mining disaster in Chile	1965	1965	América do Sul	Idade Contemporânea	0101000020E61000006666666666C651C02FDD2406813540C0
214	1962 Avensa Fairchild F-27 accident	1962 aviation accident	1962	1962	América do Sul	Idade Contemporânea	0101000020E61000003EE5DA48C0F74FC0BF8919C850F92540
215	Air France Flight 212 (1969)	1969 aviation accident	1969	1969	América do Sul	Idade Contemporânea	0101000020E6100000CDCCCCCCCCBC50C03333333333332540
216	The Tragedy of Gate 12	stampede at River Plate Stadium in Buenos Aires, Argentina	1968	1968	América do Sul	Idade Contemporânea	0101000020E61000006F8104C58F394DC0BDE3141DC94541C0
217	Matsés massacre	bombing of Matsés people in Peru	1964	1964	América do Sul	Idade Contemporânea	0101000020E610000088635DDC467352C014D044D8F0741CC0
218	Acordo de Cartagena	tratado constitutivo da Comunidade Andia	1969	1969	América do Sul	Idade Contemporânea	0101000020E6100000AF25E4839EE152C0D42B6519E2D82440
219	Sismo de Caracas de 1967	earthquake	1967	1967	América do Sul	Idade Contemporânea	0101000020E61000009A99999999D950C05C8FC2F5285C2540
220	Tragédia do Estádio Nacional	desastre de 24 de maio de 1964 em Lima, Peru	1964	1964	América do Sul	Idade Contemporânea	0101000020E610000003780B24284253C0A60A4625752228C0
221	Queda do Constellation PP-PDE	aviation incident in Brazil	1962	1962	América do Sul	Idade Contemporânea	0101000020E61000005C8FC2F528AC4DC0234A7B832FCC06C0
222	Fireworks disaster in Paramaribo	disaster in 1962 in Suriname	1962	1962	América do Sul	Idade Contemporânea	0101000020E6100000BFD21546DC944BC0D164A684C54C1740
223	Tragédia do Gran Circus Norte-Americano	tragédia devido a incêndio criminoso ocorrida em Niterói em 1961	1961	1961	América do Sul	Idade Contemporânea	0101000020E610000028F00C226B9045C024F53BA0AEE336C0
224	Voo Aerolíneas Argentinas 322	aviation accident	1961	1961	América do Sul	Idade Contemporânea	0101000020E6100000C7C7599EA88D47C08D22EF45490637C0
225	Campeonato Sul-Americano de Futebol de 1963	football tournament	1963	1963	América do Sul	Idade Contemporânea	0101000020E6100000A323B9FC870851C0575BB1BFEC7E30C0
226	LANSA Flight 501	1966 aviation accident	1966	1966	América do Sul	Idade Contemporânea	0101000020E6100000E08D1E22220A53C069F7715555D528C0
227	Green Cross Tragedy	1961 plane crash of a LAN Chile DC-3 in the Chilean Andes	1961	1961	América do Sul	Idade Contemporânea	0101000020E6100000DCA1402301CB51C03B0BEF3075F941C0
228	Villa Soldati level crossing tragedy	railway accident in Buenos Aires, Argentina	1962	1962	América do Sul	Idade Contemporânea	0101000020E61000007DAEB6627F394DC0DA1B7C61325541C0
229	Laguna del Desierto incident	1965 border clash between Argentina and Chile	1965	1965	América do Sul	Idade Contemporânea	0101000020E61000006A34B918033C52C081053065E09248C0
230	1969 Huanchaca street scandal	Police raid against LGBT population at Antofagasta, Chile, in 1969	1969	1969	América do Sul	Idade Contemporânea	0101000020E61000002B893359189951C06C8861EF14A437C0
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.events_id_seq', 230, true);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: idx_events_location; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_events_location ON public.events USING gist (location);


--
-- Name: ix_events_continent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_events_continent ON public.events USING btree (continent);


--
-- Name: ix_events_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_events_id ON public.events USING btree (id);


--
-- Name: ix_events_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_events_name ON public.events USING btree (name);


--
-- Name: ix_events_period; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_events_period ON public.events USING btree (period);


--
-- Name: ix_events_year_start; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_events_year_start ON public.events USING btree (year_start);


--
-- PostgreSQL database dump complete
--

