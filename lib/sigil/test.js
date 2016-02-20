var mochar = require('mocha');
var expect = require('chai').expect;
px2 = require("./px2");
Model = px2.Model;
var Sigil = require('./sigil');

var lisp = new Sigil({});

function ex(s) {
    return lisp.eval(lisp.readFromString(s));
}

describe("sigil", function () {
    it("should be able to readFromString", function () {
        expect(lisp.readFromString("1")).to.eql(1);
        expect(lisp.readFromString("x")).to.eql("x");
        expect(lisp.readFromString("x-1")).to.eql("x-1");
        expect(lisp.readFromString("1-x")).to.eql("1-x");
        expect(lisp.readFromString("10-10-10")).to.eql("10-10-10");
        expect(lisp.readFromString("(cons 1 2)")).to.eql(["cons", [ 1, [ 2, []]]]);
        expect(lisp.readFromString("(1 . 2)")).to.eql([1,2]);
        expect(lisp.readFromString("(1 1 . 2)")).to.eql([1, [ 1, 2]]);
    });

    it("should be able to null",
       function () {
           expect(ex("(null 1)")).to.eql([]);
           expect(ex("(null `x)")).to.eql([]);
           expect(ex("(null ())")).to.eql("t");
           expect(ex("(null `(1))")).to.eql([]);
       });

    it("should be able to atom",
       function () {
           expect(ex("(atom 1)")).to.eql("t");
           expect(ex("(atom `x)")).to.eql("t");
           expect(ex("(atom ())")).to.eql('t');
           expect(ex("(atom `(1))")).to.eql([]);
           expect(ex("(atom `(x))")).to.eql([]);
       });

    it("should be able to car and cdr",
       function () {
           expect(ex("(car `(1 2)))")).to.eql(1);
           expect(ex("(cdr `(1 2)))")).to.eql([2, []]);
       });

    it("should be able to cons",
       function () {
           expect(ex("(cons 1 2)")).to.eql([1, 2]);
           expect(ex("(cons `x `y)")).to.eql(["x", "y"]);
       });

    it("should be able to progn",
       function () {
           expect(ex("(progn 1 2)")).to.eql(2);
           expect(ex("(progn (setf x 1) (+ x x))")).to.eql(2);
       });

    it("should be able to set",
       function () {
           expect(ex("(set `x 1)")).to.eql(1);
           expect(ex("x")).to.eql(1);
       });

    it("should be able to setf",
       function () {
           expect(ex("(setf x 2)")).to.eql(2);
           expect(ex("x")).to.eql(2);
       });

    it("should be able to bind",
       function () {
           expect(ex("(bind (x y) (values 1 2) x))")).to.eql(1);
           expect(ex("(bind (x y) (values 1 2) y))")).to.eql(2);
       });

    it("should delete locals from the environment after calling a function", function () {
        ex("(defmacro x (x) x)");
        ex("(x 2)");
        expect(ex.bind("x")).to.throw();
    });

    it("should be able to define macros and run them",
       function () {
           expect(ex("(defmacro x (x) x)")).to.eql(["macro", [["x", []], ["x", []], []]]);
           expect(ex("(x 2)")).to.eql(2);
           ex("(defmacro y (x) (+ x x))");
           expect(ex("(y 2)")).to.eql(4);
           ex("(defmacro defun (n a &body b) `(setf (symbol-function ,n) (lambda ,a ,@b))))");
           ex("(defun z (x) (+ x x x))");
           expect(ex("(z 2)")).to.eql(6);
           ex("(defun a (x) (setf x 1) (setf x 3) (+ x x x))");
           expect(ex("(a 2)")).to.eql(9);
           expect(ex("x")).to.not.eql(1); // bad test, but works for now. expect to break
       });

    it("should be able to add, subtract, divide and multiply", function () {
        expect(ex("(+ 2 2 2)")).to.equal(6);
        expect(ex("(/ 10 2 1)")).to.equal(5);
        expect(ex("(* 2 2 2)")).to.equal(8);
        expect(ex("(- 2 2 2)")).to.equal(-2);
        expect(ex("(+ `a `b)")).to.equal("ab");
    });
        
    it("should not be able to set numbers", function () {
        expect(ex.bind("(set 1 1)")).to.throw();
    });

    it("should be able to call anonymous functions", function() {
        expect(ex("((lambda (x) (+ x x x)) 2)")).to.eql(6);
    });

    it("should be able to call function using regular variable environment (lisp 1, sort of)", function() {
        expect(ex("(defun funcall-test (f x) (f x))"));
        expect(ex("(defun funcall-test-2 (f x) (call f x))"));
        expect(ex("(defun funcall-test-function (x) (+ x x x))"));
        expect(ex("(funcall-test (lambda (x) (+ x x)) 1)")).to.equal(2);
        expect(ex("(funcall-test funcall-test-function 1)")).to.equal(3);
        expect(ex("(funcall-test-2 (lambda (x) (+ x x)) 1)")).to.equal(2);
        expect(ex("(funcall-test-2 funcall-test-function 1)")).to.equal(3);
    });

    it("should be able to apply",
       function () {
           expect(ex("(defun apply-test (x) (+ x x x))"));
           expect(ex("(apply-test 15)")).to.equal(45);
           expect(ex("(setf y `(10))"));
           expect(ex("(apply `apply-test y)")).to.equal(30);
           expect(ex("(apply `apply-test `(20))")).to.equal(60);
       });

    it("should be able to read bar symbols", function () {
        expect(ex("`|this is a bar symbol|")).to.equal("this is a bar symbol");
    });
});
