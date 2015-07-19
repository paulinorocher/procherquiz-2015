var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req,res, next, quizId){
	models.Quiz.findById(quizId).then(
		function(quiz){
			if(quiz) {
				req.quiz = quiz;
				next();
			} else { next (new Error('No existe quizId=' + quizId))}
		}
	).catch(function(error) { next(error);});
};

// GET /quizes/
exports.index = function(req,res){
	req.query.search = req.query.search||"";
	req.query.search = req.query.search.replace(" ", "%");
	models.Quiz.findAll({where: ["pregunta like ?","%"+req.query.search+"%"]}).then(
		function(quizes){
			res.render('quizes/index.ejs', {quizes: quizes, search: req.query.search});
		}
	).catch(function(error) { next(error);});
};

// GET /quizes/question
exports.show = function(req,res){
	res.render('quizes/show', {quiz: req.quiz});
};

// GET /quizes/answer
exports.answer = function(req,res){
	var resultado = 'Incorrecto';
	if(req.query.respuesta === req.quiz.respuesta){
		resultado = 'Correcto';
	}
	res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado});
};