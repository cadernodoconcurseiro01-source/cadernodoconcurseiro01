import { useState, useEffect } from 'react';
import { Book, RefreshCw, Heart, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DailyVerse {
  verse: string;
  reference: string;
  explanation: string;
  motivation: string;
}

// Collection of motivational bible verses for students
const verses: DailyVerse[] = [
  {
    verse: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    explanation: "Paulo escreveu estas palavras enquanto estava preso, mostrando que mesmo nas circunstâncias mais difíceis, a força divina nos capacita a superar qualquer obstáculo.",
    motivation: "Seus estudos podem parecer desafiadores, mas você tem dentro de si a capacidade de vencer. Continue firme!"
  },
  {
    verse: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    reference: "Jeremias 29:11",
    explanation: "Deus tem um plano maravilhoso para sua vida. Os estudos são parte desse propósito maior que Ele preparou para você.",
    motivation: "Cada hora de estudo é um passo em direção ao futuro que Deus planejou. Confie no processo!"
  },
  {
    verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
    reference: "Isaías 41:10",
    explanation: "Esta promessa nos lembra que nunca estamos sozinhos em nossas batalhas. O medo do fracasso não pode nos dominar quando temos essa certeza.",
    motivation: "Não tenha medo do concurso. Prepare-se com dedicação e confie que você não está sozinho nessa jornada!"
  },
  {
    verse: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.",
    reference: "Provérbios 3:5-6",
    explanation: "A sabedoria vem quando combinamos nosso esforço com a confiança em Deus. Estudar é importante, mas confiar também é.",
    motivation: "Estude com dedicação e confie que seus esforços serão recompensados. O caminho será claro!"
  },
  {
    verse: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fatigarão.",
    reference: "Isaías 40:31",
    explanation: "A espera ativa em Deus não é passividade, mas uma postura de confiança enquanto fazemos nossa parte com excelência.",
    motivation: "Quando o cansaço bater, lembre-se: suas forças serão renovadas. Descanse quando precisar e volte mais forte!"
  },
  {
    verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
    reference: "Salmos 37:5",
    explanation: "Entregar nossos planos a Deus significa fazer nossa parte com dedicação enquanto confiamos no resultado.",
    motivation: "Você está fazendo sua parte ao estudar. Entregue a ansiedade e continue focado no seu objetivo!"
  },
  {
    verse: "Pois não nos deu Deus espírito de covardia, mas de poder, de amor e de moderação.",
    reference: "2 Timóteo 1:7",
    explanation: "O medo não vem de Deus. Fomos equipados com poder para enfrentar desafios, amor para perseverar e moderação para manter o equilíbrio.",
    motivation: "Você tem poder para vencer esse concurso! Não deixe o medo te paralisar. Avance com coragem!"
  },
  {
    verse: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.",
    reference: "Romanos 12:12",
    explanation: "Este versículo nos dá três chaves para atravessar momentos difíceis: manter a alegria, praticar a paciência e ser constante.",
    motivation: "A aprovação virá! Mantenha a esperança, seja paciente com seu progresso e não desista!"
  },
  {
    verse: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.",
    reference: "Romanos 8:28",
    explanation: "Até as dificuldades nos estudos trabalham a nosso favor, desenvolvendo disciplina, persistência e conhecimento.",
    motivation: "Cada desafio nos estudos está te moldando para a vitória. Tudo coopera para o seu bem!"
  },
  {
    verse: "Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.",
    reference: "Josué 1:9",
    explanation: "Deus disse essas palavras a Josué antes de uma grande batalha. É o mesmo encorajamento para você antes do seu concurso.",
    motivation: "Seja forte e corajoso! Você não está sozinho nessa jornada. A vitória está mais perto do que imagina!"
  },
  {
    verse: "Combati o bom combate, acabei a carreira, guardei a fé.",
    reference: "2 Timóteo 4:7",
    explanation: "Paulo disse isso ao final de sua vida, mostrando que a perseverança até o fim é o que importa.",
    motivation: "Continue seu bom combate! Complete cada ciclo de estudos, termine cada revisão. A linha de chegada está próxima!"
  },
  {
    verse: "O coração do homem pode fazer planos, mas do Senhor vem a resposta.",
    reference: "Provérbios 16:1",
    explanation: "Devemos planejar nossos estudos com sabedoria, mas confiar que Deus guiará o resultado final.",
    motivation: "Planeje bem seus estudos, siga seu cronograma, e confie que a resposta certa virá no momento certo!"
  },
  {
    verse: "Bem-aventurado o homem que acha sabedoria, e o homem que adquire conhecimento.",
    reference: "Provérbios 3:13",
    explanation: "A busca pelo conhecimento é uma atitude abençoada. Cada hora de estudo é um investimento precioso.",
    motivation: "Você está no caminho certo buscando conhecimento! Seja persistente, pois a sabedoria traz bençãos!"
  },
  {
    verse: "Porque o Senhor dá a sabedoria; da sua boca vem o conhecimento e o entendimento.",
    reference: "Provérbios 2:6",
    explanation: "A verdadeira sabedoria vem de Deus. Ao estudar, peça entendimento e Ele iluminará sua mente.",
    motivation: "Ore antes de estudar! Peça sabedoria e clareza mental. Deus quer te ajudar a compreender!"
  },
  {
    verse: "Sede fortes e corajosos, não temais, nem vos atemorizeis diante deles, porque o Senhor vosso Deus é quem vai convosco; não vos deixará nem vos desamparará.",
    reference: "Deuteronômio 31:6",
    explanation: "Essa promessa foi feita ao povo de Israel antes de uma grande conquista. A mesma força está disponível para você.",
    motivation: "Enfrente sua banca examinadora sem medo! Você está preparado e não está sozinho nessa!"
  }
];

const VersePage = () => {
  const [todayVerse, setTodayVerse] = useState<DailyVerse | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Get verse based on day of year for consistency
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const verseIndex = dayOfYear % verses.length;
    setTodayVerse(verses[verseIndex]);
  }, []);

  const getRandomVerse = () => {
    const randomIndex = Math.floor(Math.random() * verses.length);
    setTodayVerse(verses[randomIndex]);
    setIsLiked(false);
  };

  const handleShare = async () => {
    if (!todayVerse) return;
    
    const text = `"${todayVerse.verse}" - ${todayVerse.reference}\n\n${todayVerse.motivation}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Versículo do Dia - Caderno do Concurseiro',
          text: text,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Versículo copiado!');
    }
  };

  if (!todayVerse) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8 animate-fade-in text-center">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <Book className="w-8 h-8 text-primary" />
          Versículo do Dia
        </h1>
        <p className="text-muted-foreground">
          Uma palavra de motivação para seus estudos
        </p>
      </header>

      <Card className="p-8 shadow-elevated animate-fade-in bg-gradient-to-br from-primary/5 to-accent/5">
        {/* Verse */}
        <div className="text-center mb-8">
          <p className="text-2xl md:text-3xl font-serif italic text-foreground leading-relaxed mb-4">
            "{todayVerse.verse}"
          </p>
          <p className="text-lg font-semibold text-primary">
            {todayVerse.reference}
          </p>
        </div>

        {/* Explanation */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 text-foreground">📖 Entendendo o versículo</h3>
          <p className="text-muted-foreground leading-relaxed">
            {todayVerse.explanation}
          </p>
        </div>

        {/* Motivation */}
        <div className="mb-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
          <h3 className="font-semibold mb-2 text-foreground">💪 Motivação para hoje</h3>
          <p className="text-foreground leading-relaxed">
            {todayVerse.motivation}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsLiked(!isLiked)}
            className={isLiked ? "text-destructive border-destructive" : ""}
          >
            <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Amei!' : 'Amei'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={getRandomVerse}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Outro Versículo
          </Button>
        </div>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-8">
        "A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos." - Hebreus 11:1
      </p>
    </div>
  );
};

export default VersePage;
