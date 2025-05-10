import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { faArrowRight, faRobot, faGraduationCap, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function HomePage() {
  const features = [
    {
      icon: faRobot,
      title: "AI Question Generator",
      description: "Automatically create quizzes from your study materials"
    },
    {
      icon: faGraduationCap,
      title: "Smart Evaluation",
      description: "Get instant feedback on your written answers"
    },
    {
      icon: faChartLine,
      title: "Progress Analytics",
      description: "Track your weak areas with detailed reports"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6"
          >
            Revolutionize Your <span className="text-purple-600">Learning</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
          >
            AI-powered tools to generate quizzes, evaluate answers, and track your academic progress.
          </motion.p>

          <motion.div 
            variants={itemVariants} 
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              Get Started
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link
              to="/features"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-medium py-3 px-8 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Key Features</h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100"
                whileHover={{ y: -5 }}
              >
                <div className="text-purple-600 text-4xl mb-6 flex justify-center">
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already boosting their academic performance with AI.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-purple-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </Link>
        </motion.div>
      </section>
    </div>
  );
}