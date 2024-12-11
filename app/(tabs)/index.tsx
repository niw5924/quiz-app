import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { decode } from "html-entities";

interface Category {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [maxQuestions, setMaxQuestions] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://opentdb.com/api_category.php");
        const data = await response.json();
        const dropdownData = data.trivia_categories.map((category: Category) => ({
          label: category.name,
          value: category.id.toString(),
        }));
        setCategories(dropdownData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMaxQuestions = async () => {
      if (!selectedCategory) return;
      try {
        const response = await fetch(
          `https://opentdb.com/api_count.php?category=${selectedCategory}`
        );
        const data = await response.json();
        setMaxQuestions(data.category_question_count.total_question_count);
      } catch (error) {
        console.error("Error fetching max questions:", error);
      }
    };
    fetchMaxQuestions();
  }, [selectedCategory]);

  const fetchQuestions = async () => {
    if (!selectedCategory) {
      alert("카테고리를 선택하세요.");
      return;
    }
    if (questionCount <= 0) {
      alert("문제 수는 1개 이상이어야 합니다.");
      return;
    }
    try {
      const url = `https://opentdb.com/api.php?amount=${questionCount}&category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.response_code === 0) {
        setQuestions(data.results);
        setQuizStarted(true);
      } else {
        alert("문제를 가져올 수 없습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("문제를 가져오는 도중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (quizStarted) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            handleAnswer("");
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [quizStarted, currentQuestionIndex]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (answer === currentQuestion.correct_answer) {
      setScore(score + 1);
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimer(10);
    } else {
      alert(`퀴즈 완료! 점수: ${score + 1}/${questions.length}`);
      setQuizStarted(false);
      setCurrentQuestionIndex(0);
      setScore(0);
      setTimer(10);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {!quizStarted ? (
          <View style={styles.quizSetup}>
            <Text style={styles.title}>랜덤 Quiz</Text>
            <Text style={styles.label}>카테고리를 선택하세요:</Text>
            <DropDownPicker
              open={open}
              value={selectedCategory}
              items={categories}
              setOpen={setOpen}
              setValue={setSelectedCategory}
              placeholder="카테고리 선택"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
            <Text style={styles.label}>문제 수를 입력하세요:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={questionCount.toString()}
              onChangeText={(text) => {
                const numericValue = parseInt(text, 10);
                const validValue =
                  maxQuestions !== null ? Math.min(numericValue, maxQuestions) : numericValue;
                setQuestionCount(isNaN(validValue) ? 0 : validValue);
              }}
            />
            {maxQuestions !== null && (
              <Text style={styles.hint}>
                선택한 카테고리에서 제공 가능한 최대 문제 수: {maxQuestions}
              </Text>
            )}
            <Button title="퀴즈 시작" onPress={fetchQuestions} />
          </View>
        ) : (
          <View>
            <Text style={styles.title}>
              질문 {currentQuestionIndex + 1}/{questions.length}
            </Text>
            <Text style={styles.timer}>남은 시간: {timer}초</Text>
            <Text style={styles.question}>
              {decode(questions[currentQuestionIndex].question)}
            </Text>
            <FlatList
              data={[
                ...questions[currentQuestionIndex].incorrect_answers,
                questions[currentQuestionIndex].correct_answer,
              ].sort()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.answerButton}
                  onPress={() => handleAnswer(decode(item))}
                >
                  <Text style={styles.answerText}>{decode(item)}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `${item}-${index}`}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  quizSetup: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    padding: 10,
  },
  hint: {
    fontSize: 12,
    color: "gray",
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: "#fafafa",
    borderColor: "gray",
    marginBottom: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fafafa",
  },
  question: {
    fontSize: 18,
    marginBottom: 20,
  },
  timer: {
    fontSize: 16,
    marginBottom: 10,
    color: "red",
  },
  answerButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
  },
  answerText: {
    fontSize: 16,
  },
});

export default App;
